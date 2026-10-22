$(function () {
    const datosPermisosEl = document.getElementById('datosPermisosMecanicos');
    const permisos = datosPermisosEl ? JSON.parse(datosPermisosEl.textContent) : { actualizar: true, eliminar: true };
    const tabla = $('#tblMecanicos').DataTable({
        ajax: { url: '/Mecanicos/ObtenerTodos', dataSrc: App.dataSrcTabla },
        columns: [
            { data: 'codigo' },
            { data: 'nombre' },
            { data: 'telefono', render: d => d || '' },
            { data: 'activo', render: d => d === 'S' ? '<span class="badge text-bg-success">Sí</span>' : '<span class="badge text-bg-secondary">No</span>' },
            {
                data: 'codigo', orderable: false, searchable: false, className: 'text-end',
                render: (codigo, type, row) => `
                    ${permisos.actualizar ? `<button class="btn btn-sm btn-outline-primary btn-editar" data-codigo="${codigo}"><i class="fa-solid fa-pen"></i></button>` : ''}
                    ${permisos.eliminar && row.activo === 'S' ? `<button class="btn btn-sm btn-outline-danger btn-desactivar" data-codigo="${codigo}" title="Desactivar"><i class="fa-solid fa-user-slash"></i></button>` : ''}
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
        const html = await $.get('/Mecanicos/FormularioCrear');
        abrirModal(html);
    });

    $('#tblMecanicos').on('click', '.btn-editar', async function () {
        const codigo = $(this).data('codigo');
        const html = await $.get('/Mecanicos/FormularioEditar', { codigo });
        abrirModal(html);
    });

    $('#tblMecanicos').on('click', '.btn-desactivar', async function () {
        const codigo = $(this).data('codigo');
        const confirmado = await Swal.fire({
            icon: 'warning',
            title: '¿Desactivar mecánico?',
            text: `El mecánico "${codigo}" dejará de ofrecerse en las órdenes de servicio nuevas. Sus órdenes anteriores no se pierden.`,
            showCancelButton: true,
            confirmButtonText: 'Desactivar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#dc3545'
        }).then(r => r.isConfirmed);
        if (!confirmado) return;

        const respuesta = await App.eliminar(`/Mecanicos/Eliminar?codigo=${encodeURIComponent(codigo)}`);
        if (!respuesta.resultado) {
            App.mostrarError(respuesta.mensaje);
            return;
        }
        App.mostrarExito('Mecánico desactivado correctamente.');
        recargarTabla();
    });

    $(document).on('click', '#btnGuardarMecanico', async function () {
        const $boton = $(this);
        const esEdicion = $boton.data('edicion') === true || $boton.data('edicion') === 'true';
        const codigo = $boton.data('codigo');

        const datos = App.recolectarFormulario('#formMecanico');
        const url = esEdicion ? `/Mecanicos/Editar?codigo=${encodeURIComponent(codigo)}` : '/Mecanicos/Crear';

        $boton.prop('disabled', true);
        try {
            const respuesta = await App.enviarJson(url, 'POST', datos);
            if (!respuesta.resultado) {
                App.mostrarError(respuesta.mensaje);
                return;
            }
            bootstrap.Modal.getInstance(document.getElementById('modalFormulario')).hide();
            App.mostrarExito(esEdicion ? 'Mecánico actualizado correctamente.' : 'Mecánico creado correctamente.');
            recargarTabla();
        } finally {
            $boton.prop('disabled', false);
        }
    });
});
