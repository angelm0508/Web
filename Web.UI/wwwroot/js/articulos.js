$(function () {
    const tabla = $('#tblArticulos').DataTable({
        ajax: { url: '/Articulos/ObtenerTodos', dataSrc: 'dato' },
        columns: [
            { data: 'codigo' },
            { data: 'nombre' },
            { data: 'precioUnitario', render: d => d != null ? Number(d).toFixed(2) : '' },
            { data: 'cantDisponible', render: d => d != null ? Number(d).toFixed(2) : '' },
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
        const html = await $.get('/Articulos/FormularioCrear');
        abrirModal(html);
    });

    $('#tblArticulos').on('click', '.btn-editar', async function () {
        const codigo = $(this).data('codigo');
        const html = await $.get('/Articulos/FormularioEditar', { codigo });
        abrirModal(html);
    });

    $('#tblArticulos').on('click', '.btn-eliminar', async function () {
        const codigo = $(this).data('codigo');
        const confirmado = await App.confirmarEliminar(`Se eliminará el artículo "${codigo}".`);
        if (!confirmado) return;

        const respuesta = await App.eliminar(`/Articulos/Eliminar?codigo=${encodeURIComponent(codigo)}`);
        if (!respuesta.resultado) {
            App.mostrarError(respuesta.mensaje);
            return;
        }
        App.mostrarExito('Artículo eliminado correctamente.');
        recargarTabla();
    });

    $(document).on('click', '#btnGuardarArticulo', async function () {
        const $boton = $(this);
        const esEdicion = $boton.data('edicion') === true || $boton.data('edicion') === 'true';
        const codigo = $boton.data('codigo');

        const datos = App.recolectarFormulario('#formArticulo');

        const url = esEdicion ? `/Articulos/Editar?codigo=${encodeURIComponent(codigo)}` : '/Articulos/Crear';
        const respuesta = await App.enviarJson(url, 'POST', datos);

        if (!respuesta.resultado) {
            App.mostrarError(respuesta.mensaje);
            return;
        }

        bootstrap.Modal.getInstance(document.getElementById('modalFormulario')).hide();
        App.mostrarExito(esEdicion ? 'Artículo actualizado correctamente.' : 'Artículo creado correctamente.');
        recargarTabla();
    });
});
