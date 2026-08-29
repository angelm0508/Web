$(function () {
    const tabla = $('#tblDirecciones').DataTable({
        ajax: { url: '/Direcciones/ObtenerTodos', dataSrc: App.dataSrcTabla },
        columns: [
            { data: 'direccion' },
            { data: 'codigoSn' },
            { data: 'municipio' },
            { data: 'departamento' },
            { data: 'tipoDireccion' },
            {
                data: 'direccion', orderable: false, className: 'text-end',
                render: direccion => `
                    <button class="btn btn-sm btn-outline-primary btn-editar" data-direccion="${direccion}"><i class="fa-solid fa-pen"></i></button>
                    <button class="btn btn-sm btn-outline-danger btn-eliminar" data-direccion="${direccion}"><i class="fa-solid fa-trash"></i></button>
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
        const html = await $.get('/Direcciones/FormularioCrear');
        abrirModal(html);
    });

    $('#tblDirecciones').on('click', '.btn-editar', async function () {
        const direccion = $(this).data('direccion');
        const html = await $.get('/Direcciones/FormularioEditar', { direccion });
        abrirModal(html);
    });

    $('#tblDirecciones').on('click', '.btn-eliminar', async function () {
        const direccion = $(this).data('direccion');
        const confirmado = await App.confirmarEliminar(`Se eliminará la dirección "${direccion}".`);
        if (!confirmado) return;

        const respuesta = await App.eliminar(`/Direcciones/Eliminar?direccion=${encodeURIComponent(direccion)}`);
        if (!respuesta.resultado) {
            App.mostrarError(respuesta.mensaje);
            return;
        }
        App.mostrarExito('Dirección eliminada correctamente.');
        recargarTabla();
    });

    $(document).on('click', '#btnGuardarDireccion', async function () {
        const $boton = $(this);
        const esEdicion = $boton.data('edicion') === true || $boton.data('edicion') === 'true';
        const direccion = $boton.data('direccion');

        const datos = App.recolectarFormulario('#formDireccion');

        const url = esEdicion ? `/Direcciones/Editar?direccion=${encodeURIComponent(direccion)}` : '/Direcciones/Crear';
        const respuesta = await App.enviarJson(url, 'POST', datos);

        if (!respuesta.resultado) {
            App.mostrarError(respuesta.mensaje);
            return;
        }

        bootstrap.Modal.getInstance(document.getElementById('modalFormulario')).hide();
        App.mostrarExito(esEdicion ? 'Dirección actualizada correctamente.' : 'Dirección creada correctamente.');
        recargarTabla();
    });
});
