$(function () {
    const datosPermisosEl = document.getElementById('datosPermisosMotocicletas');
    const permisos = datosPermisosEl ? JSON.parse(datosPermisosEl.textContent) : { actualizar: true, eliminar: true, historial: true };

    // Escapa texto de usuario para interpolarlo en HTML y en atributos entre comillas dobles.
    const escapar = v => $('<div>').text(v ?? '').html().replace(/"/g, '&quot;');

    const tabla = $('#tblMotocicletas').DataTable({
        ajax: { url: '/Motocicletas/ObtenerTodos', dataSrc: App.dataSrcTabla },
        columns: [
            { data: 'placa', render: d => escapar(d) },
            { data: 'nombreSn', render: (d, t, row) => escapar(d || row.codigoSn || '') },
            { data: 'marca', render: (d, t, row) => escapar([d, row.modelo].filter(Boolean).join(' ')) },
            { data: 'anio', render: d => d ?? '' },
            { data: 'color', render: d => escapar(d || '') },
            { data: 'activo', render: d => d === 'S' ? '<span class="badge text-bg-success">Sí</span>' : '<span class="badge text-bg-secondary">No</span>' },
            {
                data: 'entry', orderable: false, searchable: false, className: 'text-end',
                render: (entry, type, row) => `
                    ${permisos.historial ? `<button class="btn btn-sm btn-outline-secondary btn-historial" data-entry="${escapar(entry)}" data-placa="${escapar(row.placa)}" title="Historial de servicios"><i class="fa-solid fa-clock-rotate-left"></i></button>` : ''}
                    ${permisos.actualizar ? `<button class="btn btn-sm btn-outline-primary btn-editar" data-entry="${escapar(entry)}"><i class="fa-solid fa-pen"></i></button>` : ''}
                    ${permisos.eliminar && row.activo === 'S' ? `<button class="btn btn-sm btn-outline-danger btn-desactivar" data-entry="${escapar(entry)}" data-placa="${escapar(row.placa)}" title="Desactivar"><i class="fa-solid fa-ban"></i></button>` : ''}
                `
            }
        ],
        language: App.datatableEsEs
    });

    function recargarTabla() { tabla.ajax.reload(null, false); }

    function abrirModal(html) {
        $('#contenidoModal').html(html);
        $('#modalFormulario').off('.autocompletar'); // limpia los listeners de la apertura anterior
        new bootstrap.Modal('#modalFormulario').show();
        inicializarBuscadorCliente();
    }

    function inicializarBuscadorCliente() {
        if ($('#CodigoSnTexto').length === 0) return;
        App.autocompletar({
            texto: $('#CodigoSnTexto'),
            oculto: $('#CodigoSn'),
            lista: $('#CodigoSnResultados'),
            error: $('#CodigoSnError'),
            endpoint: '/Motocicletas/BuscarSocios',
            obtenerCodigo: s => s.codigo ?? s.Codigo,
            obtenerEtiqueta: s => `${s.codigo ?? s.Codigo} - ${s.nombre ?? s.Nombre}`
        });
    }

    $('#btnNuevo').on('click', async function () {
        const html = await $.get('/Motocicletas/FormularioCrear');
        abrirModal(html);
    });

    $('#tblMotocicletas').on('click', '.btn-editar', async function () {
        const entry = $(this).data('entry');
        const html = await $.get('/Motocicletas/FormularioEditar', { entry });
        abrirModal(html);
    });

    $('#tblMotocicletas').on('click', '.btn-desactivar', async function () {
        const entry = $(this).data('entry');
        const placa = $(this).data('placa');
        const confirmado = await Swal.fire({
            icon: 'warning',
            title: '¿Desactivar motocicleta?',
            text: `La motocicleta ${placa} dejará de ofrecerse en las órdenes de servicio nuevas. Su historial no se pierde.`,
            showCancelButton: true,
            confirmButtonText: 'Desactivar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#dc3545'
        }).then(r => r.isConfirmed);
        if (!confirmado) return;

        const respuesta = await App.eliminar(`/Motocicletas/Eliminar?entry=${entry}`);
        if (!respuesta.resultado) {
            App.mostrarError(respuesta.mensaje);
            return;
        }
        App.mostrarExito('Motocicleta desactivada correctamente.');
        recargarTabla();
    });

    $(document).on('click', '#btnGuardarMotocicleta', async function () {
        const $boton = $(this);
        const esEdicion = $boton.data('edicion') === true || $boton.data('edicion') === 'true';
        const entry = $boton.data('entry');

        const datos = App.recolectarFormulario('#formMotocicleta');
        if (!datos.CodigoSn) {
            App.mostrarError('Selecciona el cliente de la motocicleta.');
            return;
        }
        const url = esEdicion ? `/Motocicletas/Editar?entry=${entry}` : '/Motocicletas/Crear';

        $boton.prop('disabled', true);
        try {
            const respuesta = await App.enviarJson(url, 'POST', datos);
            if (!respuesta.resultado) {
                App.mostrarError(respuesta.mensaje);
                return;
            }
            bootstrap.Modal.getInstance(document.getElementById('modalFormulario')).hide();
            App.mostrarExito(esEdicion ? 'Motocicleta actualizada correctamente.' : 'Motocicleta creada correctamente.');
            recargarTabla();
        } finally {
            $boton.prop('disabled', false);
        }
    });

    // --- Historial de servicios de la motocicleta ---

    const ESTADOS = { R: 'Recibida', P: 'En proceso', T: 'Terminada', E: 'Entregada' };

    $('#tblMotocicletas').on('click', '.btn-historial', async function () {
        const entry = $(this).data('entry');
        const placa = $(this).data('placa');
        $('#tituloHistorial').text(`Historial de servicios - ${placa}`);
        const $cuerpo = $('#cuerpoHistorial').empty();

        const respuesta = await $.get('/Motocicletas/ObtenerHistorial', { entry });
        const ordenes = (respuesta.resultado && respuesta.dato) ? respuesta.dato : [];
        if (!respuesta.resultado) {
            App.mostrarError(respuesta.mensaje);
            return;
        }
        if (ordenes.length === 0) {
            $cuerpo.append($('<tr>').append($('<td colspan="6" class="text-center text-muted">').text('Esta motocicleta no tiene órdenes de servicio.')));
        }
        ordenes.forEach(o => {
            const estado = o.cancelado === 'S' ? 'Cancelada' : (ESTADOS[o.estadoServicio] ?? o.estadoServicio);
            $cuerpo.append($('<tr>')
                .append($('<td>').text(o.numDoc))
                .append($('<td>').text(o.fechaDoc ? new Date(o.fechaDoc).toLocaleDateString() : ''))
                .append($('<td>').text(estado))
                .append($('<td>').text(o.nombreMecanico || ''))
                .append($('<td>').text(o.fallaReportada || ''))
                .append($('<td class="text-end">').text(o.totalDoc != null ? Number(o.totalDoc).toFixed(2) : '')));
        });
        new bootstrap.Modal('#modalHistorial').show();
    });
});
