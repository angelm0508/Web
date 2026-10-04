$(function () {
    // ---- Constantes propias del documento (en la nota de debito de proveedor cambian estas lineas) ----
    const TIPO_BASE = 13;   // BaseTipo de la factura base: 13 = Factura de compra
    // ---- fin de constantes ----

    const esc = v => $('<div>').text(v ?? '').html();

    const datosPermisosEl = document.getElementById('datosPermisosNotasDebitoCompra');
    const permisos = datosPermisosEl ? JSON.parse(datosPermisosEl.textContent) : { actualizar: true, eliminar: true };

    const tabla = $('#tblNotasDebitoCompra').DataTable({
        ajax: { url: '/NotasDebitoCompra/ObtenerTodos', dataSrc: App.dataSrcTabla },
        columns: [
            { data: 'numDoc' },
            { data: 'nombreSn', render: (d, t, row) => esc(d || row.codigoSn || '') },
            { data: 'fechaDoc', render: d => d ? new Date(d).toLocaleDateString() : '' },
            {
                data: 'cancelado',
                render: d => d === 'S'
                    ? '<span class="badge text-bg-danger">Cancelado</span>'
                    : '<span class="badge text-bg-success">Abierto</span>'
            },
            { data: 'totalDoc', render: d => d != null ? Number(d).toFixed(2) : '' },
            {
                data: 'entry', orderable: false, className: 'text-end',
                render: entry => `
                    <button class="btn btn-sm btn-outline-primary btn-editar" data-entry="${entry}"${permisos.actualizar ? '' : ' title="Ver"'}><i class="fa-solid ${permisos.actualizar ? 'fa-pen' : 'fa-eye'}"></i></button>
                    ${permisos.eliminar ? `<button class="btn btn-sm btn-outline-danger btn-eliminar" data-entry="${entry}"><i class="fa-solid fa-trash"></i></button>` : ''}
                `
            }
        ],
        language: App.datatableEsEs
    });

    function recargarTabla() { tabla.ajax.reload(null, false); }

    function abrirModal(html) {
        $('#contenidoModal').html(html);
        $('#modalFormulario').off('.autocompletar'); // limpia los listeners de la apertura anterior antes de que los buscadores registren los suyos
        bootstrap.Modal.getOrCreateInstance(document.getElementById('modalFormulario')).show();
        inicializarSerie();
        inicializarBuscadorSocio();
        inicializarDetalle();
        cargarFacturasBase();
    }

    function cerrarModal() {
        bootstrap.Modal.getOrCreateInstance(document.getElementById('modalFormulario')).hide();
    }

    // --- Socio de negocio ---

    function inicializarBuscadorSocio() {
        if ($('#CodigoSnTexto').length === 0) return;
        App.autocompletar({
            texto: $('#CodigoSnTexto'),
            oculto: $('#CodigoSn'),
            lista: $('#CodigoSnResultados'),
            error: $('#CodigoSnError'),
            endpoint: '/NotasDebitoCompra/BuscarSocios',
            obtenerCodigo: s => s.codigo ?? s.Codigo,
            obtenerEtiqueta: s => `${s.codigo ?? s.Codigo} - ${s.nombre ?? s.Nombre}`,
            onSeleccion: s => {
                $('#NombreSn').val(s ? (s.nombre ?? s.Nombre) : '');
                // La factura base pertenece al socio anterior: se descarta y se recarga la lista del nuevo.
                if (hayFacturaBase()) quitarFacturaBase();
                cargarFacturasBase();
            }
        });
    }

    // --- Botones de la lista ---

    $('#btnNuevo').on('click', async function () {
        const html = await $.get('/NotasDebitoCompra/FormularioCrear');
        abrirModal(html);
    });

    $('#tblNotasDebitoCompra').on('click', '.btn-editar', async function () {
        const entry = $(this).data('entry');
        const html = await $.get('/NotasDebitoCompra/FormularioEditar', { entry });
        abrirModal(html);
    });

    $('#tblNotasDebitoCompra').on('click', '.btn-eliminar', async function () {
        const entry = $(this).data('entry');
        const confirmado = await App.confirmarEliminar(`Se eliminará la nota de débito de proveedor #${entry}. Solo se pueden eliminar notas ya canceladas.`);
        if (!confirmado) return;

        const respuesta = await App.eliminar(`/NotasDebitoCompra/Eliminar?entry=${entry}`);
        if (!respuesta.resultado) {
            App.mostrarError(respuesta.mensaje);
            return;
        }
        App.mostrarExito('Nota de débito de proveedor eliminada correctamente.');
        recargarTabla();
    });

    $(document).on('click', '#btnCancelarDocNotaDebitoCompra', async function () {
        const entry = $(this).data('entry');
        const confirmado = await App.confirmarEliminar('Se cancelará este documento. Esta acción no se puede deshacer.');
        if (!confirmado) return;

        const $btn = $(this).prop('disabled', true);
        try {
            const respuesta = await App.enviarJson(`/NotasDebitoCompra/Editar?entry=${entry}`, 'POST', { Cancelado: 'S' });
            if (!respuesta.resultado) {
                App.mostrarError(respuesta.mensaje);
                return;
            }
            cerrarModal();
            App.mostrarExito('Documento cancelado.');
            recargarTabla();
        } finally {
            $btn.prop('disabled', false);
        }
    });

    // --- Serie de numeración (solo aplica al crear) ---

    function inicializarSerie() {
        const $sel = $('#selectSerieNotaDebitoCompra');
        if ($sel.length === 0) return;

        const datosEl = document.getElementById('datosSeriesNotaDebitoCompra');
        const series = datosEl ? (JSON.parse(datosEl.textContent) || []) : [];

        $sel.html('');
        series.forEach(s => {
            const serie = s.serie ?? s.Serie;
            const nombre = s.nombreSerie ?? s.NombreSerie;
            const manual = s.manual ?? s.Manual;
            const sigNumero = s.sigNumero ?? s.SigNumero;
            $sel.append($('<option>').val(serie).text(nombre).attr('data-manual', manual).attr('data-sig-numero', sigNumero ?? ''));
        });

        // Preselecciona la serie "por defecto" del objeto; si no esta entre las opciones, la primera.
        const serieDefecto = $sel.data('serie-defecto');
        const tieneSerieDefecto = serieDefecto !== undefined && serieDefecto !== '' &&
            $sel.find(`option[value="${serieDefecto}"]`).length > 0;
        if (tieneSerieDefecto) {
            $sel.val(String(serieDefecto));
        } else if ($sel.find('option').length > 0) {
            $sel.prop('selectedIndex', 0);
        }

        actualizarNumDocSegunSerie();
    }

    function esSerieManual() {
        const $sel = $('#selectSerieNotaDebitoCompra');
        if ($sel.length === 0 || !$sel.val()) return true;
        return $sel.find('option:selected').attr('data-manual') === 'S';
    }

    function actualizarNumDocSegunSerie() {
        const $numDoc = $('#NumDoc');
        if ($numDoc.length === 0) return;

        if (esSerieManual()) {
            $numDoc.val('').prop('disabled', false).attr('placeholder', '');
        } else {
            const sigNumero = $('#selectSerieNotaDebitoCompra').find('option:selected').attr('data-sig-numero');
            $numDoc.val(sigNumero ?? '').prop('disabled', true).attr('placeholder', 'Se generará al guardar');
        }
    }

    $(document).on('change', '#selectSerieNotaDebitoCompra', actualizarNumDocSegunSerie);

    // --- Guardar ---

    $(document).on('click', '#btnGuardarNotaDebitoCompra', async function () {
        const $boton = $(this);
        const esEdicion = $boton.data('edicion') === true || $boton.data('edicion') === 'true';
        const entry = $boton.data('entry');

        if (esEdicion) {
            // En edición solo se puede cambiar el comentario (las líneas y el encabezado quedan fijos).
            $boton.prop('disabled', true);
            try {
                const respuesta = await App.enviarJson(`/NotasDebitoCompra/Editar?entry=${entry}`, 'POST', {
                    Cancelado: 'N',
                    Comentario: $('#Comentario').val()
                });
                if (!respuesta.resultado) {
                    App.mostrarError(respuesta.mensaje);
                    return;
                }
                cerrarModal();
                App.mostrarExito('Nota de débito de proveedor actualizada correctamente.');
                recargarTabla();
            } finally {
                $boton.prop('disabled', false);
            }
            return;
        }

        if (!$('#selectSerieNotaDebitoCompra').val()) {
            App.mostrarError('Debes seleccionar una serie.');
            return;
        }
        if (!$('#CodigoSn').val()) {
            App.mostrarError('Selecciona un proveedor.');
            return;
        }
        if (!$('#MonedaDoc').val()) {
            App.mostrarError('Selecciona una moneda.');
            return;
        }
        if (lineasLocales.length === 0) {
            App.mostrarError('Agrega al menos una línea al documento.');
            return;
        }

        // El número de documento no se pide para series no manuales: el servidor lo calcula al registrar.
        const datos = App.recolectarFormulario('#formNotaDebitoCompra');
        datos.Serie = $('#selectSerieNotaDebitoCompra').val();

        const baseEntry = Number($('#baseEntry').val()) || null;
        datos.BaseTipo = baseEntry ? TIPO_BASE : -1;
        datos.BaseEntry = baseEntry;

        const totales = calcularTotalesDesdeLineas(lineasLocales);
        datos.TotalBruto = totales.totalBruto;
        datos.TotalDesc = totales.totalDesc;
        datos.TotalImp = totales.totalImp;
        datos.TotalDoc = totales.totalDoc;
        datos.Lineas = lineasLocales.map(({ _id, ...linea }) => linea);

        $boton.prop('disabled', true);
        try {
            const respuesta = await App.enviarJson('/NotasDebitoCompra/Crear', 'POST', datos);
            if (!respuesta.resultado) {
                App.mostrarError(respuesta.mensaje);
                return;
            }

            const sufijoNumDoc = respuesta.numDoc != null ? ` No. documento: ${respuesta.numDoc}.` : '';
            await App.mostrarExito(`Nota de débito de proveedor creada correctamente.${sufijoNumDoc}`);
            cerrarModal();
            recargarTabla();
        } finally {
            $boton.prop('disabled', false);
        }
    });

    // --- Factura base (opcional, solo al crear) ---

    function hayFacturaBase() {
        return !!$('#baseEntry').val();
    }

    function quitarFacturaBase() {
        $('#baseEntry').val('');
        $('#textoFacturaBase').text('Sin factura de compra base: puedes crear la nota libremente.');
        $('#btnQuitarFacturaBase').addClass('d-none');
        $('#selectFacturaBase').val('');
        $('#btnCargarFacturaBase').prop('disabled', true);
    }

    async function cargarFacturasBase() {
        const $sel = $('#selectFacturaBase');
        if ($sel.length === 0) return;

        const codigoSn = $('#CodigoSn').val();
        $('#btnCargarFacturaBase').prop('disabled', true);
        if (!codigoSn) {
            $sel.html('<option value="">-- Selecciona un proveedor para ver sus facturas de compra --</option>').prop('disabled', true);
            return;
        }

        let respuesta;
        try {
            respuesta = await $.get('/NotasDebitoCompra/BuscarFacturasBase', { codigoSn });
        } catch (e) {
            // Si el proveedor cambio mientras tanto, otra carga manda sobre el select.
            if ($('#CodigoSn').val() !== codigoSn) return;
            $sel.html('<option value="">-- Sin factura de compra base --</option>').prop('disabled', false);
            return;
        }
        // Respuesta vieja: el proveedor cambio mientras esperabamos.
        if ($('#CodigoSn').val() !== codigoSn) return;

        const lista = (respuesta.resultado && respuesta.dato) ? respuesta.dato : [];
        $sel.html('<option value="">-- Sin factura de compra base --</option>').prop('disabled', false);
        lista.forEach(f => {
            const fecha = f.fechaDoc ? new Date(f.fechaDoc).toLocaleDateString() : '';
            const total = f.totalDoc != null ? Number(f.totalDoc).toFixed(2) : '';
            $sel.append($('<option>').val(f.entry).text(`#${f.numDoc} - ${fecha} - ${f.monedaDoc ?? ''} ${total}`));
        });
    }

    $(document).on('change', '#selectFacturaBase', function () {
        $('#btnCargarFacturaBase').prop('disabled', !$('#selectFacturaBase').val());
    });

    $(document).on('click', '#btnCargarFacturaBase', async function () {
        const entry = $('#selectFacturaBase').val();
        if (!entry) return;

        if (lineasLocales.length > 0) {
            const ok = await Swal.fire({
                icon: 'question',
                title: '¿Reemplazar las líneas?',
                text: 'Las líneas actuales se reemplazarán por las de la factura de compra seleccionada.',
                showCancelButton: true,
                confirmButtonText: 'Reemplazar',
                cancelButtonText: 'Cancelar'
            }).then(r => r.isConfirmed);
            if (!ok) return;
        }

        const respuesta = await $.get('/NotasDebitoCompra/ObtenerFacturaBase', { entry });
        if (!respuesta.resultado || !respuesta.dato) {
            App.mostrarError(respuesta.mensaje || 'No se pudo cargar la factura.');
            return;
        }

        const factura = respuesta.dato;
        $('#baseEntry').val(factura.entry);
        $('#textoFacturaBase').text(`Basada en la factura de compra #${factura.numDoc}. Puedes ajustar las líneas antes de guardar.`);
        $('#btnQuitarFacturaBase').removeClass('d-none');

        const monedaExiste = $('#MonedaDoc option').filter((_, o) => o.value === factura.monedaDoc).length > 0;
        if (factura.monedaDoc && monedaExiste) $('#MonedaDoc').val(factura.monedaDoc);
        if (factura.direccion) $('#Direccion').val(factura.direccion);

        lineasLocales = (factura.lineas || []).map(l => ({
            Descripcion: l.descripcion,
            Cantidad: l.cantidad,
            Precio: l.precio,
            PrecioBruto: l.precioBruto,
            PrctjeDesc: l.prctjeDesc ?? 0,
            CodigoImpuesto: l.codigoImpuesto,
            Impuesto: l.impuesto,
            TotalLinea: l.totalLinea,
            _id: proximoIdLocal++
        }));
        lineaEnEdicionId = null;
        $('#panelLineaDetalle').addClass('d-none');
        pintarDetalle();
    });

    $(document).on('click', '#btnQuitarFacturaBase', quitarFacturaBase);

    // --- Detalle: en creación se administra localmente; en edición es de solo lectura ---

    let lineasLocales = [];
    let lineasRemotas = [];
    let proximoIdLocal = 1;
    let lineaEnEdicionId = null;
    let tasaImpuestoSeleccionado = 0;
    let buscadorImpuesto;

    function esEdicionDetalle() {
        const v = $('#tblDetalleNotaDebitoCompra').data('es-edicion');
        return v === true || v === 'true';
    }

    function inicializarDetalle() {
        lineasLocales = [];
        lineasRemotas = [];
        proximoIdLocal = 1;
        lineaEnEdicionId = null;
        tasaImpuestoSeleccionado = 0;

        if ($('#tblDetalleNotaDebitoCompra').length === 0) return;

        buscadorImpuesto = App.autocompletar({
            texto: $('#detCodigoImpuestoTexto'), oculto: $('#detCodigoImpuesto'),
            lista: $('#detCodigoImpuestoResultados'), error: $('#detCodigoImpuestoError'),
            endpoint: '/NotasDebitoCompra/BuscarImpuestos',
            obtenerCodigo: i => i.codigo ?? i.Codigo,
            obtenerEtiqueta: i => `${i.nombre ?? i.Nombre} (${i.tasa ?? i.Tasa ?? 0}%)`,
            minCaracteres: 0,
            onSeleccion: i => {
                tasaImpuestoSeleccionado = i ? Number(i.tasa ?? i.Tasa ?? 0) : 0;
                recalcularLinea();
            }
        });

        if (esEdicionDetalle()) {
            cargarDetalleRemoto();
        } else {
            pintarDetalle();
        }
    }

    async function cargarDetalleRemoto() {
        const entry = $('#tblDetalleNotaDebitoCompra').data('entry');
        const respuesta = await $.get('/NotasDebitoCompra/ObtenerDetalle', { entry });
        lineasRemotas = (respuesta.resultado && respuesta.dato) ? respuesta.dato : [];
        pintarDetalle();
    }

    function calcularTotalesDesdeLineas(lista) {
        let totalBruto = 0, totalDesc = 0, totalImp = 0, totalDoc = 0;
        lista.forEach(l => {
            const cantidad = Number(l.cantidad ?? l.Cantidad ?? 0);
            const precio = Number(l.precio ?? l.Precio ?? 0);
            const prctjeDesc = Number(l.prctjeDesc ?? l.PrctjeDesc ?? 0);
            const impuesto = Number(l.impuesto ?? l.Impuesto ?? 0);
            const bruto = cantidad * precio;
            const desc = bruto * (prctjeDesc / 100);
            totalBruto += bruto;
            totalDesc += desc;
            totalImp += impuesto;
            totalDoc += (bruto - desc + impuesto);
        });
        return {
            totalBruto: totalBruto.toFixed(2),
            totalDesc: totalDesc.toFixed(2),
            totalImp: totalImp.toFixed(2),
            totalDoc: totalDoc.toFixed(2)
        };
    }

    function pintarDetalle() {
        const $tbody = $('#tblDetalleNotaDebitoCompra tbody');
        if ($tbody.length === 0) return;

        const lista = esEdicionDetalle() ? lineasRemotas : lineasLocales;

        const totales = calcularTotalesDesdeLineas(lista);
        $('#TotalBruto').val(totales.totalBruto);
        $('#TotalImp').val(totales.totalImp);
        $('#TotalDoc').val(totales.totalDoc);

        if (lista.length === 0) {
            $tbody.html('<tr><td colspan="7" class="text-center text-muted">Sin líneas de detalle</td></tr>');
            return;
        }

        $tbody.html(lista.map(linea => {
            const descripcion = linea.descripcion ?? linea.Descripcion;
            const cantidad = linea.cantidad ?? linea.Cantidad;
            const precio = linea.precio ?? linea.Precio;
            const prctjeDesc = linea.prctjeDesc ?? linea.PrctjeDesc;
            const impuesto = linea.impuesto ?? linea.Impuesto;
            const totalLinea = linea.totalLinea ?? linea.TotalLinea;
            // En edición las líneas son de solo lectura: no se pintan botones por fila.
            const acciones = esEdicionDetalle() ? '' : `
                        <button type="button" class="btn btn-sm btn-outline-primary btn-editar-linea" data-id="${linea._id}"><i class="fa-solid fa-pen"></i></button>
                        <button type="button" class="btn btn-sm btn-outline-danger btn-eliminar-linea" data-id="${linea._id}"><i class="fa-solid fa-trash"></i></button>`;
            return `
                <tr>
                    <td>${esc(descripcion)}</td>
                    <td>${cantidad ?? ''}</td>
                    <td>${precio != null ? Number(precio).toFixed(2) : ''}</td>
                    <td>${prctjeDesc ?? 0}</td>
                    <td>${impuesto != null ? Number(impuesto).toFixed(2) : '0.00'}</td>
                    <td>${totalLinea != null ? Number(totalLinea).toFixed(2) : ''}</td>
                    <td class="text-end">${acciones}</td>
                </tr>
            `;
        }).join(''));
    }

    function limpiarPanelLinea() {
        buscadorImpuesto.establecer(null);
        tasaImpuestoSeleccionado = 0;
        $('#detDescripcion').val('');
        $('#detCantidad').val('1');
        $('#detPrecio').val('');
        $('#detPrctjeDesc').val('0');
        $('#detImpuestoMonto').val('');
        $('#detTotalLinea').val('');
        lineaEnEdicionId = null;
    }

    /** Recalcula el monto de impuesto y el total de la línea con base en los campos actuales del panel. */
    function recalcularLinea() {
        const cantidad = Number($('#detCantidad').val()) || 0;
        const precio = Number($('#detPrecio').val()) || 0;
        const prctjeDesc = Number($('#detPrctjeDesc').val()) || 0;
        const tasa = tasaImpuestoSeleccionado || 0;

        const bruto = cantidad * precio;
        const desc = bruto * (prctjeDesc / 100);
        const subtotal = bruto - desc;
        const impuesto = subtotal * (tasa / 100);
        const total = subtotal + impuesto;

        $('#detImpuestoMonto').val(impuesto.toFixed(2));
        $('#detTotalLinea').val(total.toFixed(2));
    }

    $(document).on('input change', '#detCantidad, #detPrecio, #detPrctjeDesc', recalcularLinea);

    $(document).on('click', '#btnNuevaLinea', function () {
        limpiarPanelLinea();
        $('#panelLineaDetalle').removeClass('d-none');
    });

    $(document).on('click', '#btnCancelarLinea', function () {
        $('#panelLineaDetalle').addClass('d-none');
    });

    $(document).on('click', '.btn-editar-linea', async function () {
        const id = Number($(this).data('id'));
        const linea = lineasLocales.find(l => l._id === id);
        if (!linea) return;

        limpiarPanelLinea();
        lineaEnEdicionId = id;

        const codigoImpuesto = linea.CodigoImpuesto ?? linea.codigoImpuesto ?? '';
        if (codigoImpuesto) {
            const respuestaImpuesto = await $.get('/NotasDebitoCompra/ObtenerImpuestoPorCodigo', { codigo: codigoImpuesto });
            if (!respuestaImpuesto.resultado || !respuestaImpuesto.dato) {
                App.mostrarError('No se pudo cargar el impuesto de la línea. Vuelve a intentarlo.');
                limpiarPanelLinea();
                return;
            }
            buscadorImpuesto.establecer(respuestaImpuesto.dato);
        }

        $('#detDescripcion').val(linea.Descripcion ?? linea.descripcion ?? '');
        $('#detCantidad').val(linea.Cantidad ?? linea.cantidad ?? 1);
        $('#detPrecio').val(linea.Precio ?? linea.precio ?? '');
        $('#detPrctjeDesc').val(linea.PrctjeDesc ?? linea.prctjeDesc ?? 0);

        recalcularLinea();
        $('#panelLineaDetalle').removeClass('d-none');
    });

    $(document).on('click', '.btn-eliminar-linea', async function () {
        const id = Number($(this).data('id'));

        const confirmado = await App.confirmarEliminar('Se eliminará la línea de detalle seleccionada.');
        if (!confirmado) return;

        lineasLocales = lineasLocales.filter(l => l._id !== id);
        lineaEnEdicionId = null;
        $('#panelLineaDetalle').addClass('d-none');
        pintarDetalle();
    });

    $(document).on('click', '#btnGuardarLinea', function () {
        const descripcion = ($('#detDescripcion').val() || '').trim();
        const codigoImpuesto = $('#detCodigoImpuesto').val() || '';
        const cantidad = Number($('#detCantidad').val());
        const precioTexto = $('#detPrecio').val();
        const prctjeDesc = Number($('#detPrctjeDesc').val()) || 0;

        if (!descripcion) {
            App.mostrarError('Escribe la descripción del concepto.');
            return;
        }
        if (!(cantidad > 0)) {
            App.mostrarError('La cantidad debe ser mayor que 0.');
            return;
        }
        if (precioTexto === '' || Number(precioTexto) < 0) {
            App.mostrarError('Escribe un precio válido (0 o mayor).');
            return;
        }
        if (prctjeDesc < 0 || prctjeDesc > 100) {
            App.mostrarError('El descuento debe estar entre 0 y 100.');
            return;
        }
        if (!codigoImpuesto) {
            App.mostrarError('Selecciona un impuesto.');
            return;
        }

        recalcularLinea();
        const precio = Number(precioTexto);
        const linea = {
            Descripcion: descripcion,
            Cantidad: cantidad,
            Precio: precio,
            PrecioBruto: Number((cantidad * precio).toFixed(2)),
            PrctjeDesc: prctjeDesc,
            CodigoImpuesto: codigoImpuesto,
            Impuesto: Number($('#detImpuestoMonto').val()) || 0,
            TotalLinea: Number($('#detTotalLinea').val()) || 0
        };

        const existe = lineasLocales.some(l => l._id === lineaEnEdicionId);
        if (lineaEnEdicionId !== null && existe) {
            lineasLocales = lineasLocales.map(l => l._id === lineaEnEdicionId ? { ...linea, _id: l._id } : l);
        } else {
            lineasLocales.push({ ...linea, _id: proximoIdLocal++ });
        }

        $('#panelLineaDetalle').addClass('d-none');
        pintarDetalle();
    });
});
