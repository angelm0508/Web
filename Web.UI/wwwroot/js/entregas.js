$(function () {
    const tabla = $('#tblEntregas').DataTable({
        ajax: { url: '/Entregas/ObtenerTodos', dataSrc: App.dataSrcTabla },
        columns: [
            { data: 'numDoc' },
            { data: 'nombreSn', render: (d, t, row) => d || row.codigoSn || '' },
            { data: 'fechaDoc', render: d => d ? new Date(d).toLocaleDateString() : '' },
            { data: 'estadoDoc', render: d => d === 'C' ? '<span class="badge text-bg-secondary">Cancelado</span>' : '<span class="badge text-bg-success">Abierto</span>' },
            { data: 'totalDoc', render: d => d != null ? Number(d).toFixed(2) : '' },
            {
                data: 'entry', orderable: false, className: 'text-end',
                render: entry => `
                    <button class="btn btn-sm btn-outline-primary btn-editar" data-entry="${entry}"><i class="fa-solid fa-pen"></i></button>
                    <button class="btn btn-sm btn-outline-danger btn-eliminar" data-entry="${entry}"><i class="fa-solid fa-trash"></i></button>
                `
            }
        ],
        language: App.datatableEsEs
    });

    function recargarTabla() { tabla.ajax.reload(null, false); }

    function abrirModal(html) {
        $('#contenidoModal').html(html);
        new bootstrap.Modal('#modalFormulario').show();
        inicializarSerieEntrega();
        inicializarDetalle();
    }

    $('#btnNuevo').on('click', async function () {
        const html = await $.get('/Entregas/FormularioCrear');
        abrirModal(html);
    });

    $('#tblEntregas').on('click', '.btn-editar', async function () {
        const entry = $(this).data('entry');
        const html = await $.get('/Entregas/FormularioEditar', { entry });
        abrirModal(html);
    });

    $('#tblEntregas').on('click', '.btn-eliminar', async function () {
        const entry = $(this).data('entry');
        const confirmado = await App.confirmarEliminar(`Se eliminará la entrega #${entry}.`);
        if (!confirmado) return;

        const respuesta = await App.eliminar(`/Entregas/Eliminar?entry=${entry}`);
        if (!respuesta.resultado) {
            App.mostrarError(respuesta.mensaje);
            return;
        }
        App.mostrarExito('Entrega eliminada correctamente.');
        recargarTabla();
    });

    // --- Serie de numeración para generar el número de documento (solo aplica al crear) ---

    function inicializarSerieEntrega() {
        const $sel = $('#selectSerieEntrega');
        if ($sel.length === 0) return;

        const datosEl = document.getElementById('datosSeriesEntrega');
        const series = datosEl ? (JSON.parse(datosEl.textContent) || []) : [];

        $sel.html('');
        series.forEach(s => {
            const serie = s.serie ?? s.Serie;
            const nombre = s.nombreSerie ?? s.NombreSerie;
            const manual = s.manual ?? s.Manual;
            const sigNumero = s.sigNumero ?? s.SigNumero;
            $sel.append(`<option value="${serie}" data-manual="${manual}" data-sig-numero="${sigNumero ?? ''}">${nombre}</option>`);
        });

        // Preselecciona la serie configurada como "por defecto" para este objeto en la pantalla
        // "Numeración de documentos"; si no está entre las opciones (por ejemplo, quedó bloqueada
        // o eliminada), cae en la primera disponible -- ya no queda un placeholder vacío.
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

    function esSerieManualEntrega() {
        const $sel = $('#selectSerieEntrega');
        if ($sel.length === 0 || !$sel.val()) return true;
        return $sel.find('option:selected').data('manual') === 'S';
    }

    function actualizarNumDocSegunSerie() {
        const $numDoc = $('#NumDoc');
        if ($numDoc.length === 0) return;

        if (esSerieManualEntrega()) {
            $numDoc.val('').prop('disabled', false).attr('placeholder', '');
        } else {
            const sigNumero = $('#selectSerieEntrega').find('option:selected').data('sig-numero');
            $numDoc.val(sigNumero ?? '').prop('disabled', true).attr('placeholder', 'Se generará al guardar');
        }
    }

    $(document).on('change', '#selectSerieEntrega', actualizarNumDocSegunSerie);

    // Auto-completa el nombre del socio de negocio al elegirlo (queda editable después).
    $(document).on('change', '#selectCodigoSn', function () {
        const texto = $(this).find('option:selected').text();
        if (texto && texto !== '-- Seleccione --') {
            $('#NombreSn').val(texto);
        }
    });

    $(document).on('click', '#btnGuardarEntrega', async function () {
        const $boton = $(this);
        const esEdicion = $boton.data('edicion') === true || $boton.data('edicion') === 'true';
        const entry = $boton.data('entry');

        if (!esEdicion) {
            const serieSeleccionada = $('#selectSerieEntrega').val();
            if (!serieSeleccionada) {
                App.mostrarError('Debes seleccionar una serie.');
                return;
            }
        }

        // El número de documento (No. documento) no se solicita aquí para series no manuales: el
        // servidor lo calcula y avanza el consecutivo al registrar la entrega (ver
        // EntregaDomain.InsertarAsync en la API), no antes. Para series Manual, el campo #NumDoc
        // está habilitado y su valor viaja normalmente en recolectarFormulario.
        const datos = App.recolectarFormulario('#formEntrega');
        if (!esEdicion) {
            datos.Serie = $('#selectSerieEntrega').val();
        }

        const totales = calcularTotalesDesdeLineas(esEdicionDetalle() ? lineasRemotas : lineasLocales);
        datos.TotalBruto = totales.totalBruto;
        datos.TotalDesc = totales.totalDesc;
        datos.TotalImp = totales.totalImp;
        datos.TotalDoc = totales.totalDoc;

        if (!esEdicion) {
            const respuestaCabecera = await App.enviarJson('/Entregas/Crear', 'POST', datos);
            if (!respuestaCabecera.resultado) {
                App.mostrarError(respuestaCabecera.mensaje);
                return;
            }

            const entryCreado = respuestaCabecera.dato;

            if (respuestaCabecera.numDoc != null) {
                $('#NumDoc').val(respuestaCabecera.numDoc).prop('disabled', false);
            }

            let exitosas = 0;
            let fallidas = 0;

            for (const linea of lineasLocales) {
                const { _id, ...lineaSinId } = linea;
                const respuestaLinea = await App.enviarJson('/Entregas/CrearLinea', 'POST', {
                    ...lineaSinId,
                    Entry: entryCreado
                });

                if (respuestaLinea.resultado) {
                    exitosas++;
                } else {
                    fallidas++;
                    App.mostrarError(respuestaLinea.mensaje);
                }
            }

            const sufijoNumDoc = respuestaCabecera.numDoc != null ? ` No. documento: ${respuestaCabecera.numDoc}.` : '';
            if (fallidas > 0) {
                await App.mostrarExito(`Entrega creada correctamente. Líneas guardadas: ${exitosas} de ${exitosas + fallidas}.${sufijoNumDoc}`);
            } else {
                await App.mostrarExito(`Entrega creada correctamente.${sufijoNumDoc}`);
            }
            bootstrap.Modal.getInstance(document.getElementById('modalFormulario')).hide();
            recargarTabla();
            return;
        }

        const respuesta = await App.enviarJson(`/Entregas/Editar?entry=${entry}`, 'POST', datos);
        if (!respuesta.resultado) {
            App.mostrarError(respuesta.mensaje);
            return;
        }

        bootstrap.Modal.getInstance(document.getElementById('modalFormulario')).hide();
        App.mostrarExito('Entrega actualizada correctamente.');
        recargarTabla();
    });

    // --- Detalle (grid anidado): en creación se administra localmente, en edición en vivo contra la API ---

    let lineasLocales = [];
    let lineasRemotas = [];
    let proximoIdLocal = 1;
    let noLineaOriginalEnEdicion = null;
    let articulosDisponibles = [];
    let impuestosDisponibles = [];

    function esEdicionDetalle() {
        const v = $('#tblDetalleEntrega').data('es-edicion');
        return v === true || v === 'true';
    }

    function inicializarDetalle() {
        lineasLocales = [];
        lineasRemotas = [];
        proximoIdLocal = 1;
        noLineaOriginalEnEdicion = null;

        const $tabla = $('#tblDetalleEntrega');
        if ($tabla.length === 0) return;

        const datosArt = document.getElementById('datosArticulosEntrega');
        articulosDisponibles = datosArt ? (JSON.parse(datosArt.textContent) || []) : [];

        const datosImp = document.getElementById('datosImpuestosEntrega');
        impuestosDisponibles = datosImp ? (JSON.parse(datosImp.textContent) || []) : [];

        const $selArt = $('#detCodArticulo');
        $selArt.html('<option value="">-- Seleccione --</option>');
        articulosDisponibles.forEach(a => {
            const codigo = a.codigo ?? a.Codigo;
            const nombre = a.nombre ?? a.Nombre;
            $selArt.append(`<option value="${codigo}">${codigo} - ${nombre ?? ''}</option>`);
        });

        const $selImp = $('#detCodigoImpuesto');
        $selImp.html('<option value="">-- Ninguno --</option>');
        impuestosDisponibles.forEach(i => {
            const codigo = i.codigo ?? i.Codigo;
            const nombre = i.nombre ?? i.Nombre;
            const tasa = i.tasa ?? i.Tasa ?? 0;
            $selImp.append(`<option value="${codigo}" data-tasa="${tasa}">${nombre} (${tasa}%)</option>`);
        });

        if (esEdicionDetalle()) {
            cargarDetalleRemoto();
        } else {
            pintarDetalle();
        }
    }

    async function cargarDetalleRemoto() {
        const entry = $('#tblDetalleEntrega').data('entry');
        const respuesta = await $.get('/Entregas/ObtenerDetalle', { entry });
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
        const $tbody = $('#tblDetalleEntrega tbody');
        if ($tbody.length === 0) return;

        const lista = esEdicionDetalle() ? lineasRemotas : lineasLocales;

        const totales = calcularTotalesDesdeLineas(lista);
        $('#TotalBruto').val(totales.totalBruto);
        $('#TotalDoc').val(totales.totalDoc);

        if (lista.length === 0) {
            $tbody.html('<tr><td colspan="8" class="text-center text-muted">Sin líneas de detalle</td></tr>');
            return;
        }

        $tbody.html(lista.map(linea => {
            const noLinea = linea.noLinea ?? linea.NoLinea;
            const codArticulo = linea.codArticulo ?? linea.CodArticulo;
            const descripcion = linea.descripcion ?? linea.Descripcion;
            const cantidad = linea.cantidad ?? linea.Cantidad;
            const precio = linea.precio ?? linea.Precio;
            const prctjeDesc = linea.prctjeDesc ?? linea.PrctjeDesc;
            const impuesto = linea.impuesto ?? linea.Impuesto;
            const totalLinea = linea.totalLinea ?? linea.TotalLinea;
            const clave = esEdicionDetalle() ? noLinea : linea._id;
            return `
                <tr>
                    <td>${codArticulo ?? ''}</td>
                    <td>${descripcion ?? ''}</td>
                    <td>${cantidad ?? ''}</td>
                    <td>${precio != null ? Number(precio).toFixed(2) : ''}</td>
                    <td>${prctjeDesc ?? 0}</td>
                    <td>${impuesto != null ? Number(impuesto).toFixed(2) : '0.00'}</td>
                    <td>${totalLinea != null ? Number(totalLinea).toFixed(2) : ''}</td>
                    <td class="text-end">
                        <button type="button" class="btn btn-sm btn-outline-primary btn-editar-linea" data-clave="${clave}"><i class="fa-solid fa-pen"></i></button>
                        <button type="button" class="btn btn-sm btn-outline-danger btn-eliminar-linea" data-clave="${clave}"><i class="fa-solid fa-trash"></i></button>
                    </td>
                </tr>
            `;
        }).join(''));
    }

    function limpiarPanelLinea() {
        $('#detNoLineaOriginal').val('');
        $('#detCodArticulo').val('');
        $('#detCodAlmacen').val('');
        $('#detCodigoImpuesto').val('');
        $('#detDescripcion').val('');
        $('#detCantidad').val('1');
        $('#detPrecio').val('');
        $('#detPrctjeDesc').val('0');
        $('#detImpuestoMonto').val('');
        $('#detTotalLinea').val('');
        noLineaOriginalEnEdicion = null;
    }

    /** Recalcula el monto de impuesto y el total de la línea con base en los campos actuales del panel. */
    function recalcularLinea() {
        const cantidad = Number($('#detCantidad').val()) || 0;
        const precio = Number($('#detPrecio').val()) || 0;
        const prctjeDesc = Number($('#detPrctjeDesc').val()) || 0;
        const tasa = Number($('#detCodigoImpuesto').find('option:selected').data('tasa')) || 0;

        const bruto = cantidad * precio;
        const desc = bruto * (prctjeDesc / 100);
        const subtotal = bruto - desc;
        const impuesto = subtotal * (tasa / 100);
        const total = subtotal + impuesto;

        $('#detImpuestoMonto').val(impuesto.toFixed(2));
        $('#detTotalLinea').val(total.toFixed(2));
    }

    $(document).on('input change', '#detCantidad, #detPrecio, #detPrctjeDesc, #detCodigoImpuesto', recalcularLinea);

    $(document).on('change', '#detCodArticulo', function () {
        const codigo = $(this).val();
        const articulo = articulosDisponibles.find(a => (a.codigo ?? a.Codigo) === codigo);
        if (articulo) {
            $('#detDescripcion').val(articulo.nombre ?? articulo.Nombre ?? '');
            $('#detPrecio').val(articulo.precioUnitario ?? articulo.PrecioUnitario ?? 0);
            $('#detCodAlmacen').val(articulo.almacenDefecto ?? articulo.AlmacenDefecto ?? '');
        }
        recalcularLinea();
    });

    $(document).on('click', '#btnNuevaLinea', function () {
        limpiarPanelLinea();
        $('#panelLineaDetalle').removeClass('d-none');
    });

    $(document).on('click', '#btnCancelarLinea', function () {
        $('#panelLineaDetalle').addClass('d-none');
    });

    $(document).on('click', '.btn-editar-linea', function () {
        const clave = $(this).data('clave');
        const lista = esEdicionDetalle() ? lineasRemotas : lineasLocales;
        const linea = esEdicionDetalle()
            ? lista.find(l => (l.noLinea ?? l.NoLinea) === clave)
            : lista.find(l => l._id === clave);
        if (!linea) return;

        limpiarPanelLinea();
        noLineaOriginalEnEdicion = clave;

        $('#detNoLineaOriginal').val(clave);
        $('#detCodArticulo').val(linea.codArticulo ?? linea.CodArticulo ?? '');
        $('#detCodAlmacen').val(linea.codAlmacen ?? linea.CodAlmacen ?? '');
        $('#detCodigoImpuesto').val(linea.codigoImpuesto ?? linea.CodigoImpuesto ?? '');
        $('#detDescripcion').val(linea.descripcion ?? linea.Descripcion ?? '');
        $('#detCantidad').val(linea.cantidad ?? linea.Cantidad ?? 1);
        $('#detPrecio').val(linea.precio ?? linea.Precio ?? '');
        $('#detPrctjeDesc').val(linea.prctjeDesc ?? linea.PrctjeDesc ?? 0);

        recalcularLinea();
        $('#panelLineaDetalle').removeClass('d-none');
    });

    $(document).on('click', '.btn-eliminar-linea', async function () {
        const clave = $(this).data('clave');

        const confirmado = await App.confirmarEliminar('Se eliminará la línea de detalle seleccionada.');
        if (!confirmado) return;

        if (esEdicionDetalle()) {
            const entry = $('#tblDetalleEntrega').data('entry');
            const respuesta = await App.eliminar(`/Entregas/EliminarLinea?entry=${entry}&noLinea=${clave}`);
            if (!respuesta.resultado) {
                App.mostrarError(respuesta.mensaje);
                return;
            }
            App.mostrarExito('Línea eliminada correctamente.');
            cargarDetalleRemoto();
        } else {
            lineasLocales = lineasLocales.filter(l => l._id !== clave);
            pintarDetalle();
        }
    });

    $(document).on('click', '#btnGuardarLinea', async function () {
        const datosForm = App.recolectarFormulario('#formLineaDetalle');
        datosForm.CodArticulo = $('#detCodArticulo').val() || null;
        datosForm.CodigoImpuesto = $('#detCodigoImpuesto').val() || null;

        if (!datosForm.CodArticulo) {
            App.mostrarError('Selecciona un artículo.');
            return;
        }

        if (esEdicionDetalle()) {
            const entry = $('#tblDetalleEntrega').data('entry');
            const esEdicionLinea = noLineaOriginalEnEdicion !== null;
            const url = esEdicionLinea
                ? `/Entregas/EditarLinea?entry=${entry}&noLinea=${noLineaOriginalEnEdicion}`
                : '/Entregas/CrearLinea';
            const datos = { ...datosForm, Entry: entry };

            const respuesta = await App.enviarJson(url, 'POST', datos);
            if (!respuesta.resultado) {
                App.mostrarError(respuesta.mensaje);
                return;
            }

            App.mostrarExito(esEdicionLinea ? 'Línea actualizada correctamente.' : 'Línea agregada correctamente.');
            $('#panelLineaDetalle').addClass('d-none');
            cargarDetalleRemoto();
        } else {
            if (noLineaOriginalEnEdicion !== null) {
                lineasLocales = lineasLocales.map(l => l._id === noLineaOriginalEnEdicion ? { ...datosForm, _id: l._id } : l);
            } else {
                lineasLocales.push({ ...datosForm, _id: proximoIdLocal++ });
            }

            $('#panelLineaDetalle').addClass('d-none');
            pintarDetalle();
        }
    });
});
