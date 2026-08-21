$(function () {
    const tabla = $('#tblMedidas').DataTable({
        ajax: { url: '/Medidas/ObtenerTodos', dataSrc: 'dato' },
        columns: [
            { data: 'codigo' },
            { data: 'nombre' },
            { data: 'largo', render: d => d != null ? Number(d).toFixed(2) : '' },
            { data: 'ancho', render: d => d != null ? Number(d).toFixed(2) : '' },
            { data: 'altura', render: d => d != null ? Number(d).toFixed(2) : '' },
            { data: 'peso', render: d => d != null ? Number(d).toFixed(2) : '' },
            { data: 'bloqueado', render: d => d === 'S' ? '<span class="badge text-bg-secondary">Sí</span>' : '<span class="badge text-bg-success">No</span>' },
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
        const html = await $.get('/Medidas/FormularioCrear');
        abrirModal(html);
    });

    $('#tblMedidas').on('click', '.btn-editar', async function () {
        const id = $(this).data('id');
        const html = await $.get('/Medidas/FormularioEditar', { id });
        abrirModal(html);
    });

    $('#tblMedidas').on('click', '.btn-eliminar', async function () {
        const id = $(this).data('id');
        const confirmado = await App.confirmarEliminar(`Se eliminará la medida seleccionada.`);
        if (!confirmado) return;

        const respuesta = await App.eliminar(`/Medidas/Eliminar?id=${encodeURIComponent(id)}`);
        if (!respuesta.resultado) {
            App.mostrarError(respuesta.mensaje);
            return;
        }
        App.mostrarExito('Medida eliminada correctamente.');
        recargarTabla();
    });

    $(document).on('click', '#btnGuardarMedida', async function () {
        const $boton = $(this);
        const esEdicion = $boton.data('edicion') === true || $boton.data('edicion') === 'true';
        const id = $boton.data('id');

        const datos = App.recolectarFormulario('#formMedida');

        const url = esEdicion ? `/Medidas/Editar?id=${encodeURIComponent(id)}` : '/Medidas/Crear';
        const respuesta = await App.enviarJson(url, 'POST', datos);

        if (!respuesta.resultado) {
            App.mostrarError(respuesta.mensaje);
            return;
        }

        bootstrap.Modal.getInstance(document.getElementById('modalFormulario')).hide();
        App.mostrarExito(esEdicion ? 'Medida actualizada correctamente.' : 'Medida creada correctamente.');
        recargarTabla();
    });
});
