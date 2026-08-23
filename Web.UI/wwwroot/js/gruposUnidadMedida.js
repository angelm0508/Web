$(function () {
    const tabla = $('#tblGruposUnidadMedida').DataTable({
        ajax: { url: '/GruposUnidadMedida/ObtenerTodos', dataSrc: 'dato' },
        columns: [
            { data: 'nombre' },
            { data: 'baseMedida' },
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
        cargarDetalle();
    }

    $('#btnNuevo').on('click', async function () {
        const html = await $.get('/GruposUnidadMedida/FormularioCrear');
        abrirModal(html);
    });

    $('#tblGruposUnidadMedida').on('click', '.btn-editar', async function () {
        const id = $(this).data('id');
        const html = await $.get('/GruposUnidadMedida/FormularioEditar', { id });
        abrirModal(html);
    });

    $('#tblGruposUnidadMedida').on('click', '.btn-eliminar', async function () {
        const id = $(this).data('id');
        const confirmado = await App.confirmarEliminar(`Se eliminará el grupo seleccionado.`);
        if (!confirmado) return;

        const respuesta = await App.eliminar(`/GruposUnidadMedida/Eliminar?id=${encodeURIComponent(id)}`);
        if (!respuesta.resultado) {
            App.mostrarError(respuesta.mensaje);
            return;
        }
        App.mostrarExito('Grupo eliminado correctamente.');
        recargarTabla();
    });

    $(document).on('click', '#btnGuardarGrupoUnidadMedida', async function () {
        const $boton = $(this);
        const esEdicion = $boton.data('edicion') === true || $boton.data('edicion') === 'true';
        const id = $boton.data('id');

        const datos = App.recolectarFormulario('#formGrupoUnidadMedida');

        const url = esEdicion ? `/GruposUnidadMedida/Editar?id=${encodeURIComponent(id)}` : '/GruposUnidadMedida/Crear';
        const respuesta = await App.enviarJson(url, 'POST', datos);

        if (!respuesta.resultado) {
            App.mostrarError(respuesta.mensaje);
            return;
        }

        bootstrap.Modal.getInstance(document.getElementById('modalFormulario')).hide();
        App.mostrarExito(esEdicion ? 'Grupo actualizado correctamente.' : 'Grupo creado correctamente.');
        recargarTabla();
    });

    // --- Detalle (grid anidado, solo aplica en modo edición) ---

    let lineasDetalle = [];

    async function cargarDetalle() {
        const $tabla = $('#tblDetalleGrupoUnidadMedida');
        if ($tabla.length === 0) return;

        const grpMedidaEntry = $tabla.data('grupo');
        const respuesta = await $.get('/GruposUnidadMedida/ObtenerDetalle', { grpMedidaEntry });
        lineasDetalle = (respuesta.resultado && respuesta.dato) ? respuesta.dato : [];
        pintarDetalle();
    }

    function pintarDetalle() {
        const $tbody = $('#tblDetalleGrupoUnidadMedida tbody');
        if ($tbody.length === 0) return;

        if (lineasDetalle.length === 0) {
            $tbody.html('<tr><td colspan="7" class="text-center text-muted">Sin líneas de detalle</td></tr>');
            return;
        }

        $tbody.html(lineasDetalle.map(linea => `
            <tr>
                <td>${linea.medidaEntry}</td>
                <td>${linea.cantAlternativa ?? ''}</td>
                <td>${linea.cantBase ?? ''}</td>
                <td>${linea.pesoFactor ?? ''}</td>
                <td>${linea.udfFactor ?? ''}</td>
                <td>${linea.activo === 'S' ? 'Sí' : 'No'}</td>
                <td class="text-end">
                    <button class="btn btn-sm btn-outline-primary btn-editar-linea" data-num-linea="${linea.numLinea}"><i class="fa-solid fa-pen"></i></button>
                    <button class="btn btn-sm btn-outline-danger btn-eliminar-linea" data-num-linea="${linea.numLinea}"><i class="fa-solid fa-trash"></i></button>
                </td>
            </tr>
        `).join(''));
    }

    function limpiarPanelLinea() {
        $('#detNumLineaOriginal').val('');
        $('#detMedidaEntry').val('');
        $('#detCantAlternativa').val('');
        $('#detCantBase').val('');
        $('#detPesoFactor').val('');
        $('#detUdfFactor').val('');
        $('#detActivo').val('S');
    }

    $(document).on('click', '#btnNuevaLinea', function () {
        limpiarPanelLinea();
        $('#panelLineaDetalle').removeClass('d-none');
    });

    $(document).on('click', '#btnCancelarLinea', function () {
        $('#panelLineaDetalle').addClass('d-none');
    });

    $(document).on('click', '.btn-editar-linea', function () {
        const numLinea = $(this).data('num-linea');
        const linea = lineasDetalle.find(l => l.numLinea === numLinea);
        if (!linea) return;

        $('#detNumLineaOriginal').val(linea.numLinea);
        $('#detMedidaEntry').val(linea.medidaEntry);
        $('#detCantAlternativa').val(linea.cantAlternativa ?? '');
        $('#detCantBase').val(linea.cantBase ?? '');
        $('#detPesoFactor').val(linea.pesoFactor ?? '');
        $('#detUdfFactor').val(linea.udfFactor ?? '');
        $('#detActivo').val(linea.activo ?? 'S');
        $('#panelLineaDetalle').removeClass('d-none');
    });

    $(document).on('click', '.btn-eliminar-linea', async function () {
        const numLinea = $(this).data('num-linea');
        const grpMedidaEntry = $('#tblDetalleGrupoUnidadMedida').data('grupo');

        const confirmado = await App.confirmarEliminar('Se eliminará la línea de detalle seleccionada.');
        if (!confirmado) return;

        const respuesta = await App.eliminar(`/GruposUnidadMedida/EliminarLinea?grpMedidaEntry=${grpMedidaEntry}&numLinea=${numLinea}`);
        if (!respuesta.resultado) {
            App.mostrarError(respuesta.mensaje);
            return;
        }
        App.mostrarExito('Línea eliminada correctamente.');
        cargarDetalle();
    });

    $(document).on('click', '#btnGuardarLinea', async function () {
        const grpMedidaEntry = $('#tblDetalleGrupoUnidadMedida').data('grupo');
        const numLineaOriginal = $('#detNumLineaOriginal').val();
        const datos = App.recolectarFormulario('#formLineaDetalle');

        const esEdicionLinea = numLineaOriginal !== '';
        const url = esEdicionLinea
            ? `/GruposUnidadMedida/EditarLinea?grpMedidaEntry=${grpMedidaEntry}&numLinea=${numLineaOriginal}`
            : '/GruposUnidadMedida/CrearLinea';

        const respuesta = await App.enviarJson(url, 'POST', datos);
        if (!respuesta.resultado) {
            App.mostrarError(respuesta.mensaje);
            return;
        }

        App.mostrarExito(esEdicionLinea ? 'Línea actualizada correctamente.' : 'Línea agregada correctamente.');
        $('#panelLineaDetalle').addClass('d-none');
        cargarDetalle();
    });
});
