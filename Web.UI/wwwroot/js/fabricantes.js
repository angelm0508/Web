$(function () {
    const tabla = $('#tblFabricantes').DataTable({
        ajax: { url: '/Fabricantes/ObtenerTodos', dataSrc: 'dato' },
        columns: [
            { data: 'nombre' },
            {
                data: 'entry', orderable: false, className: 'text-end',
                render: id => `
                    <button class="btn btn-sm btn-outline-primary btn-editar" data-id="${id}"><i class="fa-solid fa-pen"></i></button>
                    <button class="btn btn-sm btn-outline-danger btn-eliminar" data-id="${id}"><i class="fa-solid fa-trash"></i></button>
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
        const html = await $.get('/Fabricantes/FormularioCrear');
        abrirModal(html);
    });

    $('#tblFabricantes').on('click', '.btn-editar', async function () {
        const id = $(this).data('id');
        const html = await $.get('/Fabricantes/FormularioEditar', { id });
        abrirModal(html);
    });

    $('#tblFabricantes').on('click', '.btn-eliminar', async function () {
        const id = $(this).data('id');
        const confirmado = await App.confirmarEliminar(`Se eliminará el fabricante seleccionado.`);
        if (!confirmado) return;

        const respuesta = await App.eliminar(`/Fabricantes/Eliminar?id=${encodeURIComponent(id)}`);
        if (!respuesta.resultado) {
            App.mostrarError(respuesta.mensaje);
            return;
        }
        App.mostrarExito('Fabricante eliminado correctamente.');
        recargarTabla();
    });

    $(document).on('click', '#btnGuardarFabricante', async function () {
        const $boton = $(this);
        const esEdicion = $boton.data('edicion') === true || $boton.data('edicion') === 'true';
        const id = $boton.data('id');

        const datos = App.recolectarFormulario('#formFabricante');

        const url = esEdicion ? `/Fabricantes/Editar?id=${encodeURIComponent(id)}` : '/Fabricantes/Crear';
        const respuesta = await App.enviarJson(url, 'POST', datos);

        if (!respuesta.resultado) {
            App.mostrarError(respuesta.mensaje);
            return;
        }

        bootstrap.Modal.getInstance(document.getElementById('modalFormulario')).hide();
        App.mostrarExito(esEdicion ? 'Fabricante actualizado correctamente.' : 'Fabricante creado correctamente.');
        recargarTabla();
    });
});
