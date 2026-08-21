$(function () {
    const tabla = $('#tblAlmacenes').DataTable({
        ajax: { url: '/Almacenes/ObtenerTodos', dataSrc: 'dato' },
        columns: [
            { data: 'codigo' },
            { data: 'nombre' },
            { data: 'pais' },
            { data: 'municipio' },
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
        const html = await $.get('/Almacenes/FormularioCrear');
        abrirModal(html);
    });

    $('#tblAlmacenes').on('click', '.btn-editar', async function () {
        const codigo = $(this).data('codigo');
        const html = await $.get('/Almacenes/FormularioEditar', { codigo });
        abrirModal(html);
    });

    $('#tblAlmacenes').on('click', '.btn-eliminar', async function () {
        const codigo = $(this).data('codigo');
        const confirmado = await App.confirmarEliminar(`Se eliminará el almacén "${codigo}".`);
        if (!confirmado) return;

        const respuesta = await App.eliminar(`/Almacenes/Eliminar?codigo=${encodeURIComponent(codigo)}`);
        if (!respuesta.resultado) {
            App.mostrarError(respuesta.mensaje);
            return;
        }
        App.mostrarExito('Almacén eliminado correctamente.');
        recargarTabla();
    });

    $(document).on('click', '#btnGuardarAlmacen', async function () {
        const $boton = $(this);
        const esEdicion = $boton.data('edicion') === true || $boton.data('edicion') === 'true';
        const codigo = $boton.data('codigo');

        const datos = App.recolectarFormulario('#formAlmacen');

        const url = esEdicion ? `/Almacenes/Editar?codigo=${encodeURIComponent(codigo)}` : '/Almacenes/Crear';
        const respuesta = await App.enviarJson(url, 'POST', datos);

        if (!respuesta.resultado) {
            App.mostrarError(respuesta.mensaje);
            return;
        }

        bootstrap.Modal.getInstance(document.getElementById('modalFormulario')).hide();
        App.mostrarExito(esEdicion ? 'Almacén actualizado correctamente.' : 'Almacén creado correctamente.');
        recargarTabla();
    });
});
