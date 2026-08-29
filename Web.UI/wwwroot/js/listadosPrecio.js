$(function () {
    const tabla = $('#tblListadosPrecio').DataTable({
        ajax: { url: '/ListadosPrecio/ObtenerTodos', dataSrc: App.dataSrcTabla },
        columns: [
            { data: 'nombre' },
            { data: 'base', render: d => d ?? '' },
            { data: 'factor', render: d => d != null ? Number(d).toFixed(2) : '' },
            {
                data: 'metodoRedondeo', render: d => {
                    const nombres = { 0: 'Ninguno', 1: 'A la unidad', 2: 'A 0.5', 3: 'A 5', 4: 'A 10', 5: 'A 25' };
                    return d != null ? (nombres[d] ?? d) : '';
                }
            },
            {
                data: 'reglaRedondeo', render: d => {
                    const nombres = { F: 'Hacia abajo', C: 'Hacia arriba', R: 'Al más cercano' };
                    return d ? (nombres[d] ?? d) : '';
                }
            },
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
        const html = await $.get('/ListadosPrecio/FormularioCrear');
        abrirModal(html);
    });

    $('#tblListadosPrecio').on('click', '.btn-editar', async function () {
        const id = $(this).data('id');
        const html = await $.get('/ListadosPrecio/FormularioEditar', { id });
        abrirModal(html);
    });

    $('#tblListadosPrecio').on('click', '.btn-eliminar', async function () {
        const id = $(this).data('id');
        const confirmado = await App.confirmarEliminar(`Se eliminará el listado de precio "${id}".`);
        if (!confirmado) return;

        const respuesta = await App.eliminar(`/ListadosPrecio/Eliminar?id=${encodeURIComponent(id)}`);
        if (!respuesta.resultado) {
            App.mostrarError(respuesta.mensaje);
            return;
        }
        App.mostrarExito('Listado de precio eliminado correctamente.');
        recargarTabla();
    });

    $(document).on('click', '#btnGuardarListadoPrecio', async function () {
        const $boton = $(this);
        const esEdicion = $boton.data('edicion') === true || $boton.data('edicion') === 'true';
        const id = $boton.data('id');

        const datos = App.recolectarFormulario('#formListadoPrecio');

        const url = esEdicion ? `/ListadosPrecio/Editar?id=${encodeURIComponent(id)}` : '/ListadosPrecio/Crear';
        const respuesta = await App.enviarJson(url, 'POST', datos);

        if (!respuesta.resultado) {
            App.mostrarError(respuesta.mensaje);
            return;
        }

        bootstrap.Modal.getInstance(document.getElementById('modalFormulario')).hide();
        App.mostrarExito(esEdicion ? 'Listado de precio actualizado correctamente.' : 'Listado de precio creado correctamente.');
        recargarTabla();
    });
});
