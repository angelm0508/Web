$(function () {
    const tabla = $('#tblGruposSn').DataTable({
        ajax: { url: '/GruposSn/ObtenerTodos', dataSrc: 'dato' },
        columns: [
            { data: 'nombre' },
            { data: 'bloqueado', render: d => d === 'S' ? '<span class="badge text-bg-danger">Sí</span>' : '<span class="badge text-bg-secondary">No</span>' },
            {
                data: 'entry', orderable: false, className: 'text-end',
                render: entry => `
                    <button class="btn btn-sm btn-outline-primary btn-editar" data-id="${entry}"><i class="fa-solid fa-pen"></i></button>
                    <button class="btn btn-sm btn-outline-danger btn-eliminar" data-id="${entry}"><i class="fa-solid fa-trash"></i></button>
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
        const html = await $.get('/GruposSn/FormularioCrear');
        abrirModal(html);
    });

    $('#tblGruposSn').on('click', '.btn-editar', async function () {
        const id = $(this).data('id');
        const html = await $.get('/GruposSn/FormularioEditar', { id });
        abrirModal(html);
    });

    $('#tblGruposSn').on('click', '.btn-eliminar', async function () {
        const id = $(this).data('id');
        const confirmado = await App.confirmarEliminar(`Se eliminará el grupo "${id}".`);
        if (!confirmado) return;

        const respuesta = await App.eliminar(`/GruposSn/Eliminar?id=${encodeURIComponent(id)}`);
        if (!respuesta.resultado) {
            App.mostrarError(respuesta.mensaje);
            return;
        }
        App.mostrarExito('Grupo eliminado correctamente.');
        recargarTabla();
    });

    $(document).on('click', '#btnGuardarGrupoSn', async function () {
        const $boton = $(this);
        const esEdicion = $boton.data('edicion') === true || $boton.data('edicion') === 'true';
        const id = $boton.data('id');

        const datos = App.recolectarFormulario('#formGrupoSn');

        const url = esEdicion ? `/GruposSn/Editar?id=${encodeURIComponent(id)}` : '/GruposSn/Crear';
        const respuesta = await App.enviarJson(url, 'POST', datos);

        if (!respuesta.resultado) {
            App.mostrarError(respuesta.mensaje);
            return;
        }

        bootstrap.Modal.getInstance(document.getElementById('modalFormulario')).hide();
        App.mostrarExito(esEdicion ? 'Grupo actualizado correctamente.' : 'Grupo creado correctamente.');
        recargarTabla();
    });
});
