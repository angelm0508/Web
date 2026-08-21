$(function () {
    const tabla = $('#tblGruposArticulo').DataTable({
        ajax: { url: '/GruposArticulo/ObtenerTodos', dataSrc: 'dato' },
        columns: [
            { data: 'nombre' },
            { data: 'bloqueado', render: d => d === 'S' ? '<span class="badge text-bg-secondary">Sí</span>' : '<span class="badge text-bg-success">No</span>' },
            {
                data: 'codigo', orderable: false, className: 'text-end',
                render: codigo => `
                    <button class="btn btn-sm btn-outline-primary btn-editar" data-id="${codigo}"><i class="fa-solid fa-pen"></i></button>
                    <button class="btn btn-sm btn-outline-danger btn-eliminar" data-id="${codigo}"><i class="fa-solid fa-trash"></i></button>
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
        const html = await $.get('/GruposArticulo/FormularioCrear');
        abrirModal(html);
    });

    $('#tblGruposArticulo').on('click', '.btn-editar', async function () {
        const id = $(this).data('id');
        const html = await $.get('/GruposArticulo/FormularioEditar', { id });
        abrirModal(html);
    });

    $('#tblGruposArticulo').on('click', '.btn-eliminar', async function () {
        const id = $(this).data('id');
        const confirmado = await App.confirmarEliminar(`Se eliminará el grupo de artículo seleccionado.`);
        if (!confirmado) return;

        const respuesta = await App.eliminar(`/GruposArticulo/Eliminar?id=${encodeURIComponent(id)}`);
        if (!respuesta.resultado) {
            App.mostrarError(respuesta.mensaje);
            return;
        }
        App.mostrarExito('Grupo de artículo eliminado correctamente.');
        recargarTabla();
    });

    $(document).on('click', '#btnGuardarGrupoArticulo', async function () {
        const $boton = $(this);
        const esEdicion = $boton.data('edicion') === true || $boton.data('edicion') === 'true';
        const id = $boton.data('id');

        const datos = App.recolectarFormulario('#formGrupoArticulo');

        const url = esEdicion ? `/GruposArticulo/Editar?id=${encodeURIComponent(id)}` : '/GruposArticulo/Crear';
        const respuesta = await App.enviarJson(url, 'POST', datos);

        if (!respuesta.resultado) {
            App.mostrarError(respuesta.mensaje);
            return;
        }

        bootstrap.Modal.getInstance(document.getElementById('modalFormulario')).hide();
        App.mostrarExito(esEdicion ? 'Grupo de artículo actualizado correctamente.' : 'Grupo de artículo creado correctamente.');
        recargarTabla();
    });
});
