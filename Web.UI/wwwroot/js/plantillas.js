$(function () {
    const tabla = $('#tblPlantillas').DataTable({
        ajax: { url: '/Plantillas/ObtenerTodos', dataSrc: App.dataSrcTabla },
        columns: [
            { data: 'nombre' },
            {
                data: 'id', orderable: false, className: 'text-end',
                render: id => `
                    <a class="btn btn-sm btn-outline-primary" href="/Plantillas/Permisos?plantillaId=${id}"><i class="fa-solid fa-key"></i></a>
                    <button class="btn btn-sm btn-outline-secondary btn-editar" data-id="${id}"><i class="fa-solid fa-pen"></i></button>
                    <button class="btn btn-sm btn-outline-danger btn-eliminar" data-id="${id}"><i class="fa-solid fa-trash"></i></button>
                `
            }
        ],
        language: App.datatableEsEs
    });

    function recargarTabla() { tabla.ajax.reload(null, false); }

    $('#btnNuevo').on('click', function () {
        $('#tituloModal').text('Nueva plantilla');
        $('#plantillaIdActual').val('');
        $('#formPlantilla')[0].reset();
        new bootstrap.Modal('#modalFormulario').show();
    });

    $('#tblPlantillas').on('click', '.btn-editar', async function () {
        const id = $(this).data('id');
        const respuesta = await $.get(`/Plantillas/ObtenerTodos`);
        const plantilla = (respuesta.resultado ? respuesta.dato : []).find(p => (p.id ?? p.Id) === id);
        $('#tituloModal').text('Editar plantilla');
        $('#plantillaIdActual').val(id);
        $('#Nombre').val(plantilla ? (plantilla.nombre ?? plantilla.Nombre) : '');
        new bootstrap.Modal('#modalFormulario').show();
    });

    $('#tblPlantillas').on('click', '.btn-eliminar', async function () {
        const id = $(this).data('id');
        const confirmado = await App.confirmarEliminar('Se eliminará la plantilla seleccionada.');
        if (!confirmado) return;

        const respuesta = await App.enviarJson(`/Plantillas/Eliminar?id=${id}`, 'POST', {});
        if (!respuesta.resultado) {
            App.mostrarError(respuesta.mensaje);
            return;
        }
        App.mostrarExito('Plantilla eliminada correctamente.');
        recargarTabla();
    });

    $('#btnGuardar').on('click', async function () {
        const id = $('#plantillaIdActual').val();
        const datos = App.recolectarFormulario('#formPlantilla');
        const url = id ? `/Plantillas/Editar?id=${id}` : '/Plantillas/Crear';

        const respuesta = await App.enviarJson(url, 'POST', datos);
        if (!respuesta.resultado) {
            App.mostrarError(respuesta.mensaje);
            return;
        }
        bootstrap.Modal.getInstance(document.getElementById('modalFormulario')).hide();
        App.mostrarExito(id ? 'Plantilla actualizada correctamente.' : 'Plantilla creada correctamente.');
        recargarTabla();
    });
});
