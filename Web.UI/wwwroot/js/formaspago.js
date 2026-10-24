$(function () {
    const datosPermisosEl = document.getElementById('datosPermisosFormasPago');
    const permisos = datosPermisosEl ? JSON.parse(datosPermisosEl.textContent) : { actualizar: true, eliminar: true };
    // Escapa texto de usuario para interpolarlo en HTML y en atributos entre comillas dobles.
    const escapar = v => $('<div>').text(v ?? '').html().replace(/"/g, '&quot;');
    // Escapa solo al pintar; para buscar y ordenar devuelve el texto plano.
    const textoSeguro = (d, t) => t === 'display' ? escapar(d) : (d || '');
    const tiposDato = { N: 'Ninguno', C: 'Cheque', T: 'Transferencia', J: 'Tarjeta' };

    const tabla = $('#tblFormasPago').DataTable({
        ajax: { url: '/FormasPago/ObtenerTodos', dataSrc: App.dataSrcTabla },
        columns: [
            { data: 'codigo', render: textoSeguro },
            { data: 'nombre', render: textoSeguro },
            { data: 'tipoDato', render: d => tiposDato[d] || '' },
            { data: 'activo', render: d => d === 'S' ? '<span class="badge text-bg-success">Sí</span>' : '<span class="badge text-bg-secondary">No</span>' },
            {
                data: 'codigo', orderable: false, searchable: false, className: 'text-end',
                render: (codigo, type, row) => `
                    ${permisos.actualizar ? `<button class="btn btn-sm btn-outline-primary btn-editar" data-codigo="${escapar(codigo)}"><i class="fa-solid fa-pen"></i></button>` : ''}
                    ${permisos.eliminar && row.activo === 'S' ? `<button class="btn btn-sm btn-outline-danger btn-desactivar" data-codigo="${escapar(codigo)}" title="Desactivar"><i class="fa-solid fa-ban"></i></button>` : ''}
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
        const html = await $.get('/FormasPago/FormularioCrear');
        abrirModal(html);
    });

    $('#tblFormasPago').on('click', '.btn-editar', async function () {
        const codigo = $(this).data('codigo');
        const html = await $.get('/FormasPago/FormularioEditar', { codigo });
        abrirModal(html);
    });

    $('#tblFormasPago').on('click', '.btn-desactivar', async function () {
        const codigo = $(this).data('codigo');
        const confirmado = await Swal.fire({
            icon: 'warning',
            title: '¿Desactivar forma de pago?',
            text: `La forma de pago "${codigo}" dejará de ofrecerse en los pagos nuevos. Los pagos anteriores no se pierden.`,
            showCancelButton: true,
            confirmButtonText: 'Desactivar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#dc3545'
        }).then(r => r.isConfirmed);
        if (!confirmado) return;

        const respuesta = await App.eliminar(`/FormasPago/Eliminar?codigo=${encodeURIComponent(codigo)}`);
        if (!respuesta.resultado) {
            App.mostrarError(respuesta.mensaje);
            return;
        }
        App.mostrarExito('Forma de pago desactivada correctamente.');
        recargarTabla();
    });

    $(document).on('click', '#btnGuardarFormaPago', async function () {
        const $boton = $(this);
        const esEdicion = $boton.data('edicion') === true || $boton.data('edicion') === 'true';
        const codigo = $boton.data('codigo');

        const datos = App.recolectarFormulario('#formFormaPago');
        const url = esEdicion ? `/FormasPago/Editar?codigo=${encodeURIComponent(codigo)}` : '/FormasPago/Crear';

        $boton.prop('disabled', true);
        try {
            const respuesta = await App.enviarJson(url, 'POST', datos);
            if (!respuesta.resultado) {
                App.mostrarError(respuesta.mensaje);
                return;
            }
            bootstrap.Modal.getInstance(document.getElementById('modalFormulario')).hide();
            App.mostrarExito(esEdicion ? 'Forma de pago actualizada correctamente.' : 'Forma de pago creada correctamente.');
            recargarTabla();
        } finally {
            $boton.prop('disabled', false);
        }
    });
});
