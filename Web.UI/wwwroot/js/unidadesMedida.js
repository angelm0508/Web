$(function () {
    const tabla = $('#tblUnidadesMedida').DataTable({
        ajax: { url: '/UnidadesMedida/ObtenerTodos', dataSrc: App.dataSrcTabla },
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
                render: (id, type, row) => {
                    const bloqueado = row.bloqueado === 'S';
                    const atributos = bloqueado ? 'disabled title="Registro bloqueado"' : '';
                    return `
                        <button class="btn btn-sm btn-outline-primary btn-editar" data-id="${id}" ${atributos}><i class="fa-solid fa-pen"></i></button>
                        <button class="btn btn-sm btn-outline-danger btn-eliminar" data-id="${id}" ${atributos}><i class="fa-solid fa-trash"></i></button>
                    `;
                }
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
        const html = await $.get('/UnidadesMedida/FormularioCrear');
        abrirModal(html);
    });

    $('#tblUnidadesMedida').on('click', '.btn-editar', async function () {
        const id = $(this).data('id');
        const html = await $.get('/UnidadesMedida/FormularioEditar', { id });
        abrirModal(html);
    });

    $('#tblUnidadesMedida').on('click', '.btn-eliminar', async function () {
        const id = $(this).data('id');
        const confirmado = await App.confirmarEliminar(`Se eliminará la unidad de medida seleccionada.`);
        if (!confirmado) return;

        const respuesta = await App.eliminar(`/UnidadesMedida/Eliminar?id=${encodeURIComponent(id)}`);
        if (!respuesta.resultado) {
            App.mostrarError(respuesta.mensaje);
            return;
        }
        App.mostrarExito('Unidad de medida eliminada correctamente.');
        recargarTabla();
    });

    $(document).on('click', '#btnGuardarUnidadMedida', async function () {
        const $boton = $(this);
        const esEdicion = $boton.data('edicion') === true || $boton.data('edicion') === 'true';
        const id = $boton.data('id');

        const datos = App.recolectarFormulario('#formUnidadMedida');

        const url = esEdicion ? `/UnidadesMedida/Editar?id=${encodeURIComponent(id)}` : '/UnidadesMedida/Crear';
        const respuesta = await App.enviarJson(url, 'POST', datos);

        if (!respuesta.resultado) {
            App.mostrarError(respuesta.mensaje);
            return;
        }

        bootstrap.Modal.getInstance(document.getElementById('modalFormulario')).hide();
        App.mostrarExito(esEdicion ? 'Unidad de medida actualizada correctamente.' : 'Unidad de medida creada correctamente.');
        recargarTabla();
    });
});
