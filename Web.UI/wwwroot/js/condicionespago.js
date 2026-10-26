$(function () {
    const datosPermisosEl = document.getElementById('datosPermisosCondicionesPago');
    const permisos = datosPermisosEl ? JSON.parse(datosPermisosEl.textContent) : { actualizar: true, eliminar: true };
    // Escapa texto de usuario para interpolarlo en HTML y en atributos entre comillas dobles.
    const escapar = v => $('<div>').text(v ?? '').html().replace(/"/g, '&quot;');
    // Escapa solo al pintar; para buscar y ordenar devuelve el texto plano.
    const textoSeguro = (d, t) => t === 'display' ? escapar(d) : (d || '');
    // La condición de contado (CON) es fija: no se da de baja.
    const esContado = codigo => String(codigo || '').toUpperCase() === 'CON';

    const tabla = $('#tblCondicionesPago').DataTable({
        ajax: { url: '/CondicionesPago/ObtenerTodos', dataSrc: App.dataSrcTabla },
        columns: [
            { data: 'codigo', render: textoSeguro },
            { data: 'nombre', render: textoSeguro },
            { data: 'dias', className: 'text-end', render: (d, t) => t === 'display' ? escapar(d) : (d ?? 0) },
            { data: 'activo', render: d => d === 'S' ? '<span class="badge text-bg-success">Sí</span>' : '<span class="badge text-bg-secondary">No</span>' },
            {
                data: 'codigo', orderable: false, searchable: false, className: 'text-end',
                render: (codigo, type, row) => `
                    ${permisos.actualizar ? `<button class="btn btn-sm btn-outline-primary btn-editar" data-codigo="${escapar(codigo)}"><i class="fa-solid fa-pen"></i></button>` : ''}
                    ${permisos.eliminar && row.activo === 'S' && !esContado(codigo) ? `<button class="btn btn-sm btn-outline-danger btn-desactivar" data-codigo="${escapar(codigo)}" title="Desactivar"><i class="fa-solid fa-ban"></i></button>` : ''}
                `
            }
        ],
        language: App.datatableEsEs
    });

    function recargarTabla() { tabla.ajax.reload(null, false); }

    function abrirModal(html) {
        $('#contenidoModal').html(html);
        new bootstrap.Modal('#modalFormulario').show();
    }

    $('#btnNuevo').on('click', async function () {
        const html = await $.get('/CondicionesPago/FormularioCrear');
        abrirModal(html);
    });

    $('#tblCondicionesPago').on('click', '.btn-editar', async function () {
        const codigo = $(this).data('codigo');
        const html = await $.get('/CondicionesPago/FormularioEditar', { codigo });
        abrirModal(html);
    });

    $('#tblCondicionesPago').on('click', '.btn-desactivar', async function () {
        const codigo = $(this).data('codigo');
        const confirmado = await Swal.fire({
            icon: 'warning',
            title: '¿Desactivar condición de pago?',
            text: `La condición de pago "${codigo}" dejará de poder asignarse a socios y documentos nuevos. Lo ya registrado no se pierde.`,
            showCancelButton: true,
            confirmButtonText: 'Desactivar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#dc3545'
        }).then(r => r.isConfirmed);
        if (!confirmado) return;

        const respuesta = await App.eliminar(`/CondicionesPago/Eliminar?codigo=${encodeURIComponent(codigo)}`);
        if (!respuesta.resultado) {
            App.mostrarError(respuesta.mensaje);
            return;
        }
        App.mostrarExito('Condición de pago desactivada correctamente.');
        recargarTabla();
    });

    // El código se captura siempre en mayúsculas.
    $(document).on('input', '#formCondicionPago [name="Codigo"]', function () {
        const pos = this.selectionStart;
        this.value = this.value.toUpperCase();
        if (pos !== null) this.setSelectionRange(pos, pos);
    });

    $(document).on('click', '#btnGuardarCondicionPago', async function () {
        const $boton = $(this);
        const esEdicion = $boton.data('edicion') === true || $boton.data('edicion') === 'true';
        const codigo = $boton.data('codigo');

        const datos = App.recolectarFormulario('#formCondicionPago');
        if (datos.Codigo) datos.Codigo = String(datos.Codigo).trim().toUpperCase();

        // Los días son obligatorios y enteros de 0 a 365.
        const dias = datos.Dias === null || datos.Dias === undefined ? NaN : Number(datos.Dias);
        if (!Number.isInteger(dias) || dias < 0 || dias > 365) {
            App.mostrarError('Los días de crédito deben ser un número entero entre 0 y 365.');
            return;
        }
        datos.Dias = dias;

        const url = esEdicion ? `/CondicionesPago/Editar?codigo=${encodeURIComponent(codigo)}` : '/CondicionesPago/Crear';

        $boton.prop('disabled', true);
        try {
            const respuesta = await App.enviarJson(url, 'POST', datos);
            if (!respuesta.resultado) {
                App.mostrarError(respuesta.mensaje);
                return;
            }
            bootstrap.Modal.getInstance(document.getElementById('modalFormulario')).hide();
            App.mostrarExito(esEdicion ? 'Condición de pago actualizada correctamente.' : 'Condición de pago creada correctamente.');
            recargarTabla();
        } finally {
            $boton.prop('disabled', false);
        }
    });
});
