$(function () {
    const tabla = $('#tblPedidos').DataTable({
        ajax: { url: '/Pedidos/ObtenerTodos', dataSrc: App.dataSrcTabla },
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
        $('#modalFormulario').off('.autocompletar'); // limpia los listeners de la apertura anterior antes de que los 4 buscadores registren los suyos
        new bootstrap.Modal('#modalFormulario').show();
        inicializarSeriePedido();
        inicializarBuscadorSocio();
        inicializarDetalle();
    }

    function inicializarBuscadorSocio() {
        if ($('#CodigoSnTexto').length === 0) return;
        App.autocompletar({
            texto: $('#CodigoSnTexto'),
            oculto: $('#CodigoSn'),
            lista: $('#CodigoSnResultados'),
            error: $('#CodigoSnError'),
            endpoint: '/Pedidos/BuscarSocios',
            obtenerCodigo: s => s.codigo ?? s.Codigo,
            obtenerEtiqueta: s => `${s.codigo ?? s.Codigo} - ${s.nombre ?? s.Nombre}`,
            onSeleccion: s => $('#NombreSn').val(s ? (s.nombre ?? s.Nombre) : '')
        });
    }

    $('#btnNuevo').on('click', async function () {
        const html = await $.get('/Pedidos/FormularioCrear');
        abrirModal(html);
    });

    $('#tblPedidos').on('click', '.btn-editar', async function () {
        const entry = $(this).data('entry');
        const html = await $.get('/Pedidos/FormularioEditar', { entry });
        abrirModal(html);
    });

    $('#tblPedidos').on('click', '.btn-eliminar', async function () {
        const entry = $(this).data('entry');
        const confirmado = await App.confirmarEliminar(`Se eliminará el pedido #${entry}.`);
        if (!confirmado) return;

        const respuesta = await App.eliminar(`/Pedidos/Eliminar?entry=${entry}`);
        if (!respuesta.resultado) {
            App.mostrarError(respuesta.mensaje);
            return;
        }
        App.mostrarExito('Pedido eliminado correctamente.');
        recargarTabla();
    });

    // --- Serie de numeración para generar el número de documento (solo aplica al crear) ---

    function inicializarSeriePedido() {
        const $sel = $('#selectSeriePedido');
        if ($sel.length === 0) return;

        const datosEl = document.getElementById('datosSeriesPedido');
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

    function esSerieManualPedido() {
        const $sel = $('#selectSeriePedido');
        if ($sel.length === 0 || !$sel.val()) return true;
        return $sel.find('option:selected').data('manual') === 'S';
    }

    function actualizarNumDocSegunSerie() {
        const $numDoc = $('#NumDoc');
        if ($numDoc.length === 0) return;

        if (esSerieManualPedido()) {
            $numDoc.val('').prop('disabled', false).attr('placeholder', '');
        } else {
            const sigNumero = $('#selectSeriePedido').find('option:selected').data('sig-numero');
            $numDoc.val(sigNumero ?? '').prop('disabled', true).attr('placeholder', 'Se generará al guardar');
        }
    }

    $(document).on('change', '#selectSeriePedido', actualizarNumDocSegunSerie);

    $(document).on('click', '#btnGuardarPedido', async function () {
        const $boton = $(this);
        const esEdicion = $boton.data('edicion') === true || $boton.data('edicion') === 'true';
        const entry = $boton.data('entry');

        if (!esEdicion) {
            const serieSeleccionada = $('#selectSeriePedido').val();
            if (!serieSeleccionada) {
                App.mostrarError('Debes seleccionar una serie.');
                return;
            }
        }

        // El número de documento (No. documento) no se solicita aquí para series no manuales: el
        // servidor lo calcula y avanza el consecutivo al registrar el pedido (ver
        // PedidoDomain.InsertarAsync en la API), no antes. Para series Manual, el campo #NumDoc
        // está habilitado y su valor viaja normalmente en recolectarFormulario.
        const datos = App.recolectarFormulario('#formPedido');
        if (!esEdicion) {
            datos.Serie = $('#selectSeriePedido').val();
        }

        const totales = calcularTotalesDesdeLineas(esEdicionDetalle() ? lineasRemotas : lineasLocales);
        datos.TotalBruto = totales.totalBruto;
        datos.TotalDesc = totales.totalDesc;
        datos.TotalImp = totales.totalImp;
        datos.TotalDoc = totales.totalDoc;

        if (!esEdicion) {
            const respuestaCabecera = await App.enviarJson('/Pedidos/Crear', 'POST', datos);
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
                const respuestaLinea = await App.enviarJson('/Pedidos/CrearLinea', 'POST', {
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
                await App.mostrarExito(`Pedido creado correctamente. Líneas guardadas: ${exitosas} de ${exitosas + fallidas}.${sufijoNumDoc}`);
            } else {
                await App.mostrarExito(`Pedido creado correctamente.${sufijoNumDoc}`);
            }
            bootstrap.Modal.getInstance(document.getElementById('modalFormulario')).hide();
            recargarTabla();
            return;
        }

        const respuesta = await App.enviarJson(`/Pedidos/Editar?entry=${entry}`, 'POST', datos);
        if (!respuesta.resultado) {
            App.mostrarError(respuesta.mensaje);
            return;
        }

        bootstrap.Modal.getInstance(document.getElementById('modalFormulario')).hide();
        App.mostrarExito('Pedido actualizado correctamente.');
        recargarTabla();
    });

    // --- Detalle (grid anidado): en creación se administra localmente, en edición en vivo contra la API ---

    let lineasLocales = [];
    let lineasRemotas = [];
    let proximoIdLocal = 1;
    let noLineaOriginalEnEdicion = null;
    let tasaImpuestoSeleccionado = 0;
    let buscadorArticulo, buscadorAlmacen, buscadorImpuesto;

    function esEdicionDetalle() {
        const v = $('#tblDetallePedido').data('es-edicion');
        return v === true || v === 'true';
    }

    function inicializarDetalle() {
        lineasLocales = [];
        lineasRemotas = [];
        proximoIdLocal = 1;
        noLineaOriginalEnEdicion = null;

        const $tabla = $('#tblDetallePedido');
        if ($tabla.length === 0) return;

        buscadorArticulo = App.autocompletar({
            texto: $('#detCodArticuloTexto'), oculto: $('#detCodArticulo'),
            lista: $('#detCodArticuloResultados'), error: $('#detCodArticuloError'),
            endpoint: '/Pedidos/BuscarArticulos',
            obtenerCodigo: a => a.codigo ?? a.Codigo,
            obtenerEtiqueta: a => `${a.codigo ?? a.Codigo} - ${a.nombre ?? a.Nombre}`,
            onSeleccion: async a => {
                if (!a) return;
                $('#detDescripcion').val(a.nombre ?? a.Nombre ?? '');
                $('#detPrecio').val(a.precioUnitario ?? a.PrecioUnitario ?? 0);
                // No se escribe el <input> del buscador de Almacén directamente -- hay que pasar
                // por buscadorAlmacen.establecer() para que su estado interno ("resuelto") quede
                // consistente (si no, un texto inválido escrito antes en ese campo podría dejarlo
                // bloqueado para siempre aunque visualmente parezca tener un valor).
                const almacenDefecto = a.almacenDefecto ?? a.AlmacenDefecto ?? '';
                if (almacenDefecto) {
                    const respuestaAlmacen = await $.get('/Pedidos/ObtenerAlmacenPorCodigo', { codigo: almacenDefecto });
                    buscadorAlmacen.establecer(respuestaAlmacen.resultado && respuestaAlmacen.dato ? respuestaAlmacen.dato : { codigo: almacenDefecto, nombre: almacenDefecto });
                } else {
                    buscadorAlmacen.establecer(null);
                }
                recalcularLinea();
            }
        });

        buscadorAlmacen = App.autocompletar({
            texto: $('#detCodAlmacenTexto'), oculto: $('#detCodAlmacen'),
            lista: $('#detCodAlmacenResultados'), error: $('#detCodAlmacenError'),
            endpoint: '/Pedidos/BuscarAlmacenes',
            obtenerCodigo: al => al.codigo ?? al.Codigo,
            obtenerEtiqueta: al => `${al.codigo ?? al.Codigo} - ${al.nombre ?? al.Nombre}`
        });

        buscadorImpuesto = App.autocompletar({
            texto: $('#detCodigoImpuestoTexto'), oculto: $('#detCodigoImpuesto'),
            lista: $('#detCodigoImpuestoResultados'), error: $('#detCodigoImpuestoError'),
            endpoint: '/Pedidos/BuscarImpuestos',
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
        const entry = $('#tblDetallePedido').data('entry');
        const respuesta = await $.get('/Pedidos/ObtenerDetalle', { entry });
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
        const $tbody = $('#tblDetallePedido tbody');
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
        buscadorArticulo.establecer(null);
        buscadorAlmacen.establecer(null);
        buscadorImpuesto.establecer(null);
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
        const clave = $(this).data('clave');
        const lista = esEdicionDetalle() ? lineasRemotas : lineasLocales;
        const linea = esEdicionDetalle()
            ? lista.find(l => (l.noLinea ?? l.NoLinea) === clave)
            : lista.find(l => l._id === clave);
        if (!linea) return;

        limpiarPanelLinea();
        noLineaOriginalEnEdicion = clave;

        const codArticulo = linea.codArticulo ?? linea.CodArticulo ?? '';
        const codAlmacen = linea.codAlmacen ?? linea.CodAlmacen ?? '';
        const codigoImpuesto = linea.codigoImpuesto ?? linea.CodigoImpuesto ?? '';

        $('#detNoLineaOriginal').val(clave);

        buscadorArticulo.establecer(codArticulo ? { codigo: codArticulo, nombre: linea.descripcion ?? linea.Descripcion ?? '' } : null);

        if (codAlmacen) {
            const respuestaAlmacen = await $.get('/Pedidos/ObtenerAlmacenPorCodigo', { codigo: codAlmacen });
            buscadorAlmacen.establecer(respuestaAlmacen.resultado && respuestaAlmacen.dato ? respuestaAlmacen.dato : { codigo: codAlmacen, nombre: codAlmacen });
        } else {
            buscadorAlmacen.establecer(null);
        }

        if (codigoImpuesto) {
            const respuestaImpuesto = await $.get('/Pedidos/ObtenerImpuestoPorCodigo', { codigo: codigoImpuesto });
            buscadorImpuesto.establecer(respuestaImpuesto.resultado && respuestaImpuesto.dato ? respuestaImpuesto.dato : { codigo: codigoImpuesto, nombre: codigoImpuesto, tasa: 0 });
        } else {
            buscadorImpuesto.establecer(null);
        }

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
            const entry = $('#tblDetallePedido').data('entry');
            const respuesta = await App.eliminar(`/Pedidos/EliminarLinea?entry=${entry}&noLinea=${clave}`);
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
            const entry = $('#tblDetallePedido').data('entry');
            const esEdicionLinea = noLineaOriginalEnEdicion !== null;
            const url = esEdicionLinea
                ? `/Pedidos/EditarLinea?entry=${entry}&noLinea=${noLineaOriginalEnEdicion}`
                : '/Pedidos/CrearLinea';
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
