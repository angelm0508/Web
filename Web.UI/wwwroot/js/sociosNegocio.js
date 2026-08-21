$(function () {
    const tabla = $('#tblSociosNegocio').DataTable({
        ajax: { url: '/SociosNegocio/ObtenerTodos', dataSrc: 'dato' },
        columns: [
            { data: 'codigo' },
            { data: 'nombre' },
            { data: 'tipoSn' },
            { data: 'nit' },
            { data: 'tel1' },
            { data: 'activo', render: d => d === 'S' ? '<span class="badge text-bg-success">Sí</span>' : '<span class="badge text-bg-secondary">No</span>' },
            {
                data: 'codigo', orderable: false, className: 'text-end',
                render: codigo => `
                    <button class="btn btn-sm btn-outline-primary btn-editar" data-codigo="${codigo}"><i class="fa-solid fa-pen"></i></button>
                    <button class="btn btn-sm btn-outline-danger btn-eliminar" data-codigo="${codigo}"><i class="fa-solid fa-trash"></i></button>
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
        const html = await $.get('/SociosNegocio/FormularioCrear');
        abrirModal(html);
    });

    $('#tblSociosNegocio').on('click', '.btn-editar', async function () {
        const codigo = $(this).data('codigo');
        const html = await $.get('/SociosNegocio/FormularioEditar', { codigo });
        abrirModal(html);
    });

    $('#tblSociosNegocio').on('click', '.btn-eliminar', async function () {
        const codigo = $(this).data('codigo');
        const confirmado = await App.confirmarEliminar(`Se eliminará el socio de negocio "${codigo}".`);
        if (!confirmado) return;

        const respuesta = await App.eliminar(`/SociosNegocio/Eliminar?codigo=${encodeURIComponent(codigo)}`);
        if (!respuesta.resultado) {
            App.mostrarError(respuesta.mensaje);
            return;
        }
        App.mostrarExito('Socio de negocio eliminado correctamente.');
        recargarTabla();
    });

    $(document).on('click', '#btnGuardarSocioNegocio', async function () {
        const $boton = $(this);
        const esEdicion = $boton.data('edicion') === true || $boton.data('edicion') === 'true';
        const codigo = $boton.data('codigo');

        const datos = App.recolectarFormulario('#formSocioNegocio');

        const url = esEdicion ? `/SociosNegocio/Editar?codigo=${encodeURIComponent(codigo)}` : '/SociosNegocio/Crear';
        const respuesta = await App.enviarJson(url, 'POST', datos);

        if (!respuesta.resultado) {
            App.mostrarError(respuesta.mensaje);
            return;
        }

        bootstrap.Modal.getInstance(document.getElementById('modalFormulario')).hide();
        App.mostrarExito(esEdicion ? 'Socio de negocio actualizado correctamente.' : 'Socio de negocio creado correctamente.');
        recargarTabla();
    });
});
