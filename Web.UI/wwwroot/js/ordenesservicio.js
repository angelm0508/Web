$(function () {
    const datosPermisosEl = document.getElementById('datosPermisosOrdenesServicio');
    const permisos = datosPermisosEl ? JSON.parse(datosPermisosEl.textContent) : { actualizar: true, eliminar: true, copiarA: {} };
    const destinosCopia = [
        permisos.copiarA && permisos.copiarA.factura && { nombre: 'Factura de venta', url: '/Facturas' }
    ].filter(Boolean);

    // Escapa el HTML del texto de usuario antes de interpolarlo en el render (display) y en atributos data-*.
    const escapar = v => $('<div>').text(v ?? '').html().replace(/"/g, '&quot;');

    // Estados de la orden y a cuál avanza cada uno.
    const ESTADOS = {
        R: { nombre: 'Recibida', clase: 'text-bg-secondary', siguiente: 'P' },
        P: { nombre: 'En proceso', clase: 'text-bg-primary', siguiente: 'T' },
        T: { nombre: 'Terminada', clase: 'text-bg-warning', siguiente: 'E' },
        E: { nombre: 'Entregada', clase: 'text-bg-success', siguiente: null }
    };

    function insigniaEstado(row) {
        if (row && row.cancelado === 'S') return '<span class="badge text-bg-danger">Cancelada</span>';
        const e = ESTADOS[row && row.estadoServicio];
        return e ? `<span class="badge ${e.clase}">${e.nombre}</span>` : '';
    }

    const tabla = $('#tblOrdenesServicio').DataTable({
        ajax: { url: '/OrdenesServicio/ObtenerTodos', dataSrc: App.dataSrcTabla, data: d => { d.estado = $('#filtroEstado').val() || ''; } },
        order: [[0, 'desc']],
        columns: [
            { data: 'numDoc' },
            { data: 'fechaDoc', render: d => d ? new Date(d).toLocaleDateString() : '' },
            { data: 'nombreSn', render: (d, t, row) => { const v = d || row.codigoSn || ''; return t === 'display' ? escapar(v) : v; } },
            {
                data: 'placa',
                render: (d, t, row) => {
                    if (!d) return '';
                    if (t !== 'display') return `${d}${row.motoDescripcion ? ' ' + row.motoDescripcion : ''}`;
                    return `${escapar(d)}${row.motoDescripcion ? ` <span class="text-muted small">${escapar(row.motoDescripcion)}</span>` : ''}`;
                }
            },
            { data: 'nombreMecanico', render: (d, t) => t === 'display' ? escapar(d) : (d || '') },
            {
                data: 'estadoServicio',
                render: (d, t, row) => {
                    if (t === 'display') return insigniaEstado(row);
                    // Para ordenar y buscar: texto plano (el nombre del estado, o "Cancelada").
                    if (row && row.cancelado === 'S') return 'Cancelada';
                    const e = ESTADOS[row && row.estadoServicio];
                    return e ? e.nombre : '';
                }
            },
            { data: 'totalDoc', render: d => d != null ? Number(d).toFixed(2) : '' },
            {
                data: 'entry', orderable: false, searchable: false, className: 'text-end',
                render: (entry, t, row) => {
                    const cancelada = !row || row.cancelado === 'S';
                    const estado = ESTADOS[row && row.estadoServicio];
                    const facturable = !cancelada && (row.estadoServicio === 'T' || row.estadoServicio === 'E');
                    const siguiente = estado && estado.siguiente ? ESTADOS[estado.siguiente] : null;
                    const puedeAvanzar = permisos.actualizar && !cancelada && siguiente;
                    return `
                        ${facturable ? App.botonCopiarA(70, entry, destinosCopia) : ''}
                        ${puedeAvanzar ? `<button class="btn btn-sm btn-outline-success btn-avanzar" data-entry="${escapar(entry)}" data-estado="${escapar(estado.siguiente)}" title="Pasar a ${siguiente.nombre}"><i class="fa-solid fa-forward-step"></i></button>` : ''}
                        <button class="btn btn-sm btn-outline-primary btn-editar" data-entry="${escapar(entry)}"${permisos.actualizar ? '' : ' title="Ver"'}><i class="fa-solid ${permisos.actualizar ? 'fa-pen' : 'fa-eye'}"></i></button>
                    `;
                }
            }
        ],
        language: App.datatableEsEs
    });

    function recargarTabla() { tabla.ajax.reload(null, false); }

    $('#filtroEstado').on('change', recargarTabla);

    $('#tblOrdenesServicio').on('click', '.btn-avanzar', async function () {
        const entry = $(this).data('entry');
        const estado = $(this).data('estado');
        const confirmado = await Swal.fire({
            icon: 'question',
            title: '¿Cambiar el estado de la orden?',
            text: `La orden pasará a "${ESTADOS[estado].nombre}". No se puede volver a un estado anterior.`,
            showCancelButton: true,
            confirmButtonText: 'Cambiar',
            cancelButtonText: 'Cancelar'
        }).then(r => r.isConfirmed);
        if (!confirmado) return;

        const respuesta = await App.enviarJson(`/OrdenesServicio/CambiarEstado?entry=${entry}&estado=${estado}`, 'POST', {});
        if (!respuesta.resultado) {
            App.mostrarError(respuesta.mensaje);
            return;
        }
        App.mostrarExito(`Orden ${ESTADOS[estado].nombre.toLowerCase()}.`);
        recargarTabla();
    });

    // ================================================================ formulario

    function abrirModal(html) {
        $('#contenidoModal').html(html);
        $('#modalFormulario').off('.autocompletar'); // limpia los listeners de la apertura anterior antes de que los buscadores registren los suyos
        new bootstrap.Modal('#modalFormulario').show();
        inicializarSerieOrden();
        inicializarBuscadorCliente();
        inicializarDetalle();
    }

    $('#btnNuevo').on('click', async function () {
        const html = await $.get('/OrdenesServicio/FormularioCrear');
        abrirModal(html);
    });

    $('#tblOrdenesServicio').on('click', '.btn-editar', async function () {
        const entry = $(this).data('entry');
        const html = await $.get('/OrdenesServicio/FormularioEditar', { entry });
        abrirModal(html);
    });

    // --- Cliente y motocicleta ---

    async function cargarMotos(codigoSn, seleccionar) {
        const $sel = $('#MotoEntry');
        $sel.empty().append($('<option>').val('').text('-- Seleccione --'));
        if (!codigoSn) return;
        try {
            const r = await $.get('/OrdenesServicio/MotosDeCliente', { codigoSn });
            const motos = (r.resultado && r.dato) ? r.dato : [];
            motos.forEach(m => {
                const detalle = [m.marca, m.modelo].filter(Boolean).join(' ');
                $sel.append($('<option>').val(m.entry).text(detalle ? `${m.placa} - ${detalle}` : m.placa));
            });
            if (seleccionar) $sel.val(String(seleccionar));
        } catch (e) { /* sin motos que ofrecer */ }
    }

    function inicializarBuscadorCliente() {
        if ($('#CodigoSnTexto').length === 0) return;
        App.autocompletar({
            texto: $('#CodigoSnTexto'),
            oculto: $('#CodigoSn'),
            lista: $('#CodigoSnResultados'),
            error: $('#CodigoSnError'),
            endpoint: '/OrdenesServicio/BuscarSocios',
            obtenerCodigo: s => s.codigo ?? s.Codigo,
            obtenerEtiqueta: s => `${s.codigo ?? s.Codigo} - ${s.nombre ?? s.Nombre}`,
            onSeleccion: async s => {
                $('#NombreSn').val(s ? (s.nombre ?? s.Nombre) : '');
                await cargarMotos(s ? (s.codigo ?? s.Codigo) : null);
                const nueva = s ? (s.numLstPrecio ?? s.NumLstPrecio ?? null) : null;
                if (nueva === listaPrecioSocio) return;
                listaPrecioSocio = nueva;
                await ofrecerRecalcularLineas();
            }
        });
    }

    $(document).on('click', '#btnNuevaMoto', function () {
        if (!$('#CodigoSn').val()) {
            App.mostrarError('Selecciona primero el cliente.');
            return;
        }
        $('#panelMotoRapida').removeClass('d-none');
        $('#mrPlaca').trigger('focus');
    });

    $(document).on('click', '#btnCancelarMoto', function () {
        $('#panelMotoRapida').addClass('d-none');
    });

    $(document).on('click', '#btnGuardarMoto', async function () {
        const $boton = $(this);
        const codigoSn = $('#CodigoSn').val();
        if (!codigoSn) {
            App.mostrarError('Selecciona primero el cliente.');
            return;
        }
        const datos = {
            CodigoSn: codigoSn,
            Placa: $('#mrPlaca').val(),
            Marca: $('#mrMarca').val() || null,
            Modelo: $('#mrModelo').val() || null,
            Anio: $('#mrAnio').val() ? Number($('#mrAnio').val()) : null,
            Color: $('#mrColor').val() || null,
            Activo: 'S'
        };

        $boton.prop('disabled', true);
        try {
            const respuesta = await App.enviarJson('/OrdenesServicio/CrearMoto', 'POST', datos);
            if (!respuesta.resultado) {
                App.mostrarError(respuesta.mensaje);
                return;
            }
            await cargarMotos(codigoSn, respuesta.dato);
            $('#panelMotoRapida').addClass('d-none').find('input').val('');
            App.mostrarExito('Motocicleta registrada.');
        } finally {
            $boton.prop('disabled', false);
        }
    });

    // --- Serie de numeración (solo aplica al crear) ---

    function inicializarSerieOrden() {
        const $sel = $('#selectSerieOrden');
        if ($sel.length === 0) return;

        const datosEl = document.getElementById('datosSeriesOrden');
        const series = datosEl ? (JSON.parse(datosEl.textContent) || []) : [];

        $sel.empty();
        series.forEach(s => {
            const sigNumero = s.sigNumero ?? s.SigNumero;
            $sel.append($('<option>')
                .val(s.serie ?? s.Serie)
                .attr('data-manual', s.manual ?? s.Manual)
                .attr('data-sig-numero', sigNumero ?? '')
                .text(s.nombreSerie ?? s.NombreSerie));
        });

        // Preselecciona la serie "por defecto" configurada en "Numeración de documentos"; si no está
        // entre las opciones cae en la primera disponible.
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
        const $sel = $('#selectSerieOrden');
        if ($sel.length === 0 || !$sel.val()) return true;
        return $sel.find('option:selected').data('manual') === 'S';
    }

    function actualizarNumDocSegunSerie() {
        const $numDoc = $('#NumDoc');
        if ($numDoc.length === 0 || $('#selectSerieOrden').length === 0) return;

        if (esSerieManual()) {
            $numDoc.val('').prop('disabled', false).attr('placeholder', '');
        } else {
            const sigNumero = $('#selectSerieOrden').find('option:selected').data('sig-numero');
            $numDoc.val(sigNumero ?? '').prop('disabled', true).attr('placeholder', 'Se generará al guardar');
        }
    }

    $(document).on('change', '#selectSerieOrden', actualizarNumDocSegunSerie);

    // --- Guardar y cancelar la orden ---

    $(document).on('click', '#btnGuardarOrden', async function () {
        const $boton = $(this);
        const esEdicion = $boton.data('edicion') === true || $boton.data('edicion') === 'true';
        const entry = $boton.data('entry');

        // El número de documento no se solicita aquí para series no manuales: el servidor lo calcula y avanza
        // el consecutivo al registrar la orden. Para series Manual el campo #NumDoc está habilitado y viaja normal.
        const datos = App.recolectarFormulario('#formOrden');

        if (!esEdicion) {
            const serie = $('#selectSerieOrden').val();
            if (!serie) {
                App.mostrarError('Debes seleccionar una serie.');
                return;
            }
            datos.Serie = serie;
            if (!datos.CodigoSn) {
                App.mostrarError('Selecciona el cliente.');
                return;
            }
            if (!datos.MotoEntry) {
                App.mostrarError('Selecciona la motocicleta del cliente.');
                return;
            }
            if (!datos.MonedaDoc) {
                App.mostrarError('Selecciona la moneda.');
                return;
            }
            datos.Lineas = lineasLocales.map(App.sinCamposInternos);

            // Guardar queda deshabilitado mientras dura la petición: un doble clic no debe crear dos órdenes
            // ni descontar dos veces el inventario.
            $boton.prop('disabled', true);
            try {
                const respuesta = await App.enviarJson('/OrdenesServicio/Crear', 'POST', datos);
                if (!respuesta.resultado) {
                    App.mostrarError(respuesta.mensaje);
                    return;
                }
                const sufijoNumDoc = respuesta.numDoc != null ? ` No. documento: ${respuesta.numDoc}.` : '';
                await App.mostrarExito(`Orden de servicio creada correctamente.${sufijoNumDoc}`);
                bootstrap.Modal.getInstance(document.getElementById('modalFormulario')).hide();
                recargarTabla();
            } finally {
                $boton.prop('disabled', false);
            }
            return;
        }

        $boton.prop('disabled', true);
        try {
            const respuesta = await App.enviarJson(`/OrdenesServicio/Editar?entry=${entry}`, 'POST', datos);
            if (!respuesta.resultado) {
                App.mostrarError(respuesta.mensaje);
                return;
            }
            bootstrap.Modal.getInstance(document.getElementById('modalFormulario')).hide();
            App.mostrarExito('Orden de servicio actualizada correctamente.');
            recargarTabla();
        } finally {
            $boton.prop('disabled', false);
        }
    });

    $(document).on('click', '#btnCancelarOrden', async function () {
        const entry = $(this).data('entry');
        const confirmado = await Swal.fire({
            icon: 'warning',
            title: '¿Cancelar la orden de servicio?',
            text: 'Los insumos de la orden volverán al inventario. Esta acción no se puede deshacer.',
            showCancelButton: true,
            confirmButtonText: 'Cancelar orden',
            cancelButtonText: 'Volver',
            confirmButtonColor: '#dc3545'
        }).then(r => r.isConfirmed);
        if (!confirmado) return;

        const $btn = $(this).prop('disabled', true);
        try {
            const respuesta = await App.enviarJson(`/OrdenesServicio/Cancelar?entry=${entry}`, 'POST', {});
            if (!respuesta.resultado) {
                App.mostrarError(respuesta.mensaje);
                return;
            }
            bootstrap.Modal.getInstance(document.getElementById('modalFormulario')).hide();
            App.mostrarExito(respuesta.mensaje || 'Orden cancelada.');
            recargarTabla();
        } finally {
            $btn.prop('disabled', false);
        }
    });

    // ================================================================ líneas (insumos y servicios)
    // En el alta las líneas se administran localmente y viajan con la orden; en la edición cada operación
    // se guarda en vivo contra la API (con su movimiento de inventario).

    let lineasLocales = [];
    let lineasRemotas = [];
    let proximoIdLocal = 1;
    let noLineaOriginalEnEdicion = null;
    let tasaImpuestoSeleccionado = 0;
    let buscadorArticuloCod, buscadorArticuloDesc, buscadorAlmacen, buscadorImpuesto;
    let sincronizandoArticulo = false;
    let listaPrecioSocio = null;
    let tipoLineaActual = 'I';   // 'I' = insumo (inventario), 'S' = servicio: decide qué artículos ofrece el buscador y si pide almacén

    function esEdicionDetalle() {
        const v = $('#tblDetalleOrden').data('es-edicion');
        return v === true || v === 'true';
    }

    function lineasEditables() {
        const v = $('#tblDetalleOrden').data('lineas-editables');
        return v === true || v === 'true';
    }

    function entryActual() {
        return $('#tblDetalleOrden').data('entry');
    }

    function esInsumoLinea(linea) {
        return (linea.esInsumo ?? linea.EsInsumo) === 'S' || linea._esInsumo === true;
    }

    function inicializarDetalle() {
        lineasLocales = [];
        lineasRemotas = [];
        proximoIdLocal = 1;
        noLineaOriginalEnEdicion = null;
        tipoLineaActual = 'I';

        listaPrecioSocio = null;
        const codSnActual = $('#CodigoSn').val();
        if (codSnActual) {
            App.obtenerListaDeSocio(codSnActual).then(n => { listaPrecioSocio = n; });
        }

        const $tabla = $('#tblDetalleOrden');
        if ($tabla.length === 0) return;

        // Si la orden no se puede editar (entregada, cancelada o sin permiso) no hay panel de línea.
        if ($('#detArtCodTexto').length > 0) {
            buscadorArticuloCod = App.autocompletar({
                texto: $('#detArtCodTexto'), oculto: $('#detCodArticulo'),
                lista: $('#detArtCodResultados'), error: $('#detArtCodError'),
                endpoint: '/OrdenesServicio/BuscarArticulosPorCodigo',
                parametros: () => ({ tipo: tipoLineaActual }),
                obtenerCodigo: a => a.codigo ?? a.Codigo,
                obtenerEtiqueta: a => `${a.codigo ?? a.Codigo} - ${a.nombre ?? a.Nombre}`,
                onSeleccion: a => aplicarArticuloSeleccionado(a, 'cod')
            });
            buscadorArticuloDesc = App.autocompletar({
                texto: $('#detArtDescTexto'), oculto: $('#detCodArticulo'),
                lista: $('#detArtDescResultados'), error: $('#detArtDescError'),
                endpoint: '/OrdenesServicio/BuscarArticulos',
                parametros: () => ({ tipo: tipoLineaActual }),
                obtenerCodigo: a => a.codigo ?? a.Codigo,
                obtenerEtiqueta: a => `${a.nombre ?? a.Nombre} (${a.codigo ?? a.Codigo})`,
                onSeleccion: a => aplicarArticuloSeleccionado(a, 'desc')
            });
            buscadorAlmacen = App.autocompletar({
                texto: $('#detCodAlmacenTexto'), oculto: $('#detCodAlmacen'),
                lista: $('#detCodAlmacenResultados'), error: $('#detCodAlmacenError'),
                endpoint: '/OrdenesServicio/BuscarAlmacenes',
                obtenerCodigo: al => al.codigo ?? al.Codigo,
                obtenerEtiqueta: al => `${al.codigo ?? al.Codigo} - ${al.nombre ?? al.Nombre}`
            });
            buscadorImpuesto = App.autocompletar({
                texto: $('#detCodigoImpuestoTexto'), oculto: $('#detCodigoImpuesto'),
                lista: $('#detCodigoImpuestoResultados'), error: $('#detCodigoImpuestoError'),
                endpoint: '/OrdenesServicio/BuscarImpuestos',
                obtenerCodigo: i => i.codigo ?? i.Codigo,
                obtenerEtiqueta: i => `${i.nombre ?? i.Nombre} (${i.tasa ?? i.Tasa ?? 0}%)`,
                minCaracteres: 0,
                onSeleccion: i => {
                    tasaImpuestoSeleccionado = i ? Number(i.tasa ?? i.Tasa ?? 0) : 0;
                    recalcularLinea();
                }
            });
        }

        if (esEdicionDetalle()) {
            cargarDetalleRemoto();
        } else {
            pintarDetalle();
        }
    }

    async function cargarDetalleRemoto() {
        const respuesta = await $.get('/OrdenesServicio/ObtenerDetalle', { entry: entryActual() });
        lineasRemotas = (respuesta.resultado && respuesta.dato) ? respuesta.dato : [];
        pintarDetalle();
    }

    // En la edición los totales de la cabecera son los del servidor (él redondea por línea).
    async function refrescarTotalesServidor() {
        const r = await $.get('/OrdenesServicio/ObtenerUno', { entry: entryActual() });
        if (r.resultado && r.dato) {
            $('#TotalBruto').val(Number(r.dato.totalBruto ?? 0).toFixed(2));
            $('#TotalImp').val(Number(r.dato.totalImp ?? 0).toFixed(2));
            $('#TotalDoc').val(Number(r.dato.totalDoc ?? 0).toFixed(2));
        }
        recargarTabla();
    }

    function calcularTotalesDesdeLineas(lista) {
        let totalBruto = 0, totalImp = 0, totalDoc = 0;
        lista.forEach(l => {
            const cantidad = Number(l.cantidad ?? l.Cantidad ?? 0);
            const precio = Number(l.precio ?? l.Precio ?? 0);
            const prctjeDesc = Number(l.prctjeDesc ?? l.PrctjeDesc ?? 0);
            const impuesto = Number(l.impuesto ?? l.Impuesto ?? 0);
            const bruto = cantidad * precio;
            const desc = bruto * (prctjeDesc / 100);
            totalBruto += bruto;
            totalImp += impuesto;
            totalDoc += (bruto - desc + impuesto);
        });
        return { totalBruto: totalBruto.toFixed(2), totalImp: totalImp.toFixed(2), totalDoc: totalDoc.toFixed(2) };
    }

    // Al cambiar el cliente en el alta, ofrece recalcular los precios de las líneas ya cargadas.
    async function ofrecerRecalcularLineas() {
        if (esEdicionDetalle()) return;                 // en la edición las líneas ya guardadas conservan su precio
        if (!lineasLocales.length || listaPrecioSocio == null) return;

        const ok = await Swal.fire({
            icon: 'question',
            title: '¿Actualizar precios?',
            text: 'Se recalcularán los precios de las líneas según la lista de precio del cliente seleccionado.',
            showCancelButton: true,
            confirmButtonText: 'Actualizar',
            cancelButtonText: 'Mantener'
        }).then(r => r.isConfirmed);
        if (!ok) return;

        for (const l of lineasLocales) {
            const nuevo = await App.resolverPrecioLista(l.CodArticulo, listaPrecioSocio);
            if (nuevo == null) continue;
            const viejo = Number(l.Precio ?? 0);
            if (!viejo) continue;   // sin precio previo no se puede reescalar el impuesto en proporción
            const cant = Number(l.Cantidad ?? 0);
            const pd = Number(l.PrctjeDesc ?? 0);
            const impNuevo = Number((Number(l.Impuesto ?? 0) * (nuevo / viejo)).toFixed(2));
            const bruto = cant * nuevo;
            l.Precio = nuevo;
            l.Impuesto = impNuevo;
            l.TotalLinea = Number((bruto - bruto * (pd / 100) + impNuevo).toFixed(2));
        }
        pintarDetalle();
    }

    function pintarDetalle() {
        const $tbody = $('#tblDetalleOrden tbody');
        if ($tbody.length === 0) return;

        const edicion = esEdicionDetalle();
        const lista = edicion ? lineasRemotas : lineasLocales;

        // En el alta los totales se muestran con lo local (el servidor los recalcula al guardar).
        if (!edicion) {
            const totales = calcularTotalesDesdeLineas(lista);
            $('#TotalBruto').val(totales.totalBruto);
            $('#TotalImp').val(totales.totalImp);
            $('#TotalDoc').val(totales.totalDoc);
        }

        if (lista.length === 0) {
            $tbody.html('<tr><td colspan="10" class="text-center text-muted">Sin líneas</td></tr>');
            return;
        }

        const editables = lineasEditables();
        $tbody.empty();
        lista.forEach(linea => {
            const noLinea = linea.noLinea ?? linea.NoLinea;
            const clave = edicion ? noLinea : linea._id;
            const precio = linea.precio ?? linea.Precio;
            const impuesto = linea.impuesto ?? linea.Impuesto;
            const totalLinea = linea.totalLinea ?? linea.TotalLinea;
            const insumo = esInsumoLinea(linea);

            const $fila = $('<tr>')
                .append($('<td>').html(insumo ? '<span class="badge text-bg-primary">Insumo</span>' : '<span class="badge text-bg-info">Servicio</span>'))
                .append($('<td>').text(linea.codArticulo ?? linea.CodArticulo ?? ''))
                .append($('<td>').text(linea.descripcion ?? linea.Descripcion ?? ''))
                .append($('<td>').text(linea.codAlmacen ?? linea.CodAlmacen ?? ''))
                .append($('<td>').text(linea.cantidad ?? linea.Cantidad ?? ''))
                .append($('<td>').text(precio != null ? Number(precio).toFixed(2) : ''))
                .append($('<td>').text(linea.prctjeDesc ?? linea.PrctjeDesc ?? 0))
                .append($('<td>').text(impuesto != null ? Number(impuesto).toFixed(2) : '0.00'))
                .append($('<td>').text(totalLinea != null ? Number(totalLinea).toFixed(2) : ''));
            const $acciones = $('<td class="text-end">');
            if (editables) {
                // `clave` es numérico (noLinea de la API o id local), nunca texto de usuario.
                $acciones.html(`
                    <button type="button" class="btn btn-sm btn-outline-primary btn-editar-linea" data-clave="${Number(clave)}"><i class="fa-solid fa-pen"></i></button>
                    <button type="button" class="btn btn-sm btn-outline-danger btn-eliminar-linea" data-clave="${Number(clave)}"><i class="fa-solid fa-trash"></i></button>`);
            }
            $tbody.append($fila.append($acciones));
        });
    }

    // Sincroniza las dos cajas de artículo sin re-disparar onSeleccion (establecer() lo haría).
    function setArticuloEnAmbasCajas(item) {
        sincronizandoArticulo = true;
        try {
            buscadorArticuloCod.establecer(item || null);
            buscadorArticuloDesc.establecer(item || null);
            $('#detCodArticulo').val(item ? (item.codigo ?? item.Codigo) : '');
        } finally {
            sincronizandoArticulo = false;
        }
    }

    // Handler de selección del usuario en cualquiera de las dos cajas.
    function aplicarArticuloSeleccionado(a, origen) {
        if (sincronizandoArticulo) return; // corta la recursión de establecer()
        sincronizandoArticulo = true;
        try {
            $('#detCodArticulo').val(a ? (a.codigo ?? a.Codigo) : '');
            if (origen !== 'cod')  buscadorArticuloCod.establecer(a || null);
            if (origen !== 'desc') buscadorArticuloDesc.establecer(a || null);
        } finally {
            sincronizandoArticulo = false;
        }
        if (!a) { buscadorAlmacen.establecer(null); return; }
        $('#detDescripcion').val(a.nombre ?? a.Nombre ?? '');
        aplicarPrecioDeArticulo(a);
        if (tipoLineaActual === 'I') aplicarAlmacenDefectoDeArticulo(a);
        recalcularLinea();
    }

    // Coloca en #detPrecio el precio de lista del cliente, o el PrecioUnitario base si no hay lista.
    async function aplicarPrecioDeArticulo(a) {
        const base = a.precioUnitario ?? a.PrecioUnitario ?? 0;
        const pLista = await App.resolverPrecioLista(a.codigo ?? a.Codigo, listaPrecioSocio);
        $('#detPrecio').val(pLista != null ? pLista : base);
        recalcularLinea();
    }

    async function aplicarAlmacenDefectoDeArticulo(a) {
        const cod = a.almacenDefecto ?? a.AlmacenDefecto ?? '';
        if (!cod) { buscadorAlmacen.establecer(null); return; }
        const r = await $.get('/OrdenesServicio/ObtenerAlmacenPorCodigo', { codigo: cod });
        buscadorAlmacen.establecer(r.resultado && r.dato ? r.dato : { codigo: cod, nombre: cod });
    }

    function limpiarPanelLinea() {
        $('#detNoLineaOriginal').val('');
        setArticuloEnAmbasCajas(null);
        buscadorAlmacen.establecer(null);
        buscadorImpuesto.establecer(null);
        tasaImpuestoSeleccionado = 0;
        $('#detDescripcion').val('');
        $('#detCantidad').val('1');
        $('#detPrecio').val('');
        $('#detPrctjeDesc').val('0');
        $('#detImpuestoMonto').val('');
        $('#detTotalLinea').val('');
        noLineaOriginalEnEdicion = null;
    }

    function mostrarPanelLinea() {
        $('#grupoAlmacen').toggleClass('d-none', tipoLineaActual === 'S');
        $('#tituloPanelLinea').text(tipoLineaActual === 'S' ? 'Servicio / mano de obra' : 'Insumo del inventario');
        $('#panelLineaDetalle').removeClass('d-none');
    }

    /** Recalcula el monto de impuesto y el total de la línea con base en los campos actuales del panel. */
    function recalcularLinea() {
        const cantidad = Number($('#detCantidad').val()) || 0;
        const precio = Number($('#detPrecio').val()) || 0;
        const prctjeDesc = Number($('#detPrctjeDesc').val()) || 0;
        const tasa = tasaImpuestoSeleccionado || 0;

        const bruto = cantidad * precio;
        const subtotal = bruto - bruto * (prctjeDesc / 100);
        const impuesto = subtotal * (tasa / 100);

        $('#detImpuestoMonto').val(impuesto.toFixed(2));
        $('#detTotalLinea').val((subtotal + impuesto).toFixed(2));
    }

    $(document).on('input change', '#detCantidad, #detPrecio, #detPrctjeDesc', recalcularLinea);

    $(document).on('click', '#btnNuevoInsumo', function () {
        tipoLineaActual = 'I';
        limpiarPanelLinea();
        mostrarPanelLinea();
    });

    $(document).on('click', '#btnNuevoServicio', function () {
        tipoLineaActual = 'S';
        limpiarPanelLinea();
        mostrarPanelLinea();
    });

    $(document).on('click', '#btnCancelarLinea', function () {
        $('#panelLineaDetalle').addClass('d-none');
    });

    $(document).on('click', '.btn-editar-linea', async function () {
        const clave = $(this).data('clave');
        const edicion = esEdicionDetalle();
        const linea = edicion
            ? lineasRemotas.find(l => (l.noLinea ?? l.NoLinea) === clave)
            : lineasLocales.find(l => l._id === clave);
        if (!linea) return;

        tipoLineaActual = esInsumoLinea(linea) ? 'I' : 'S';
        limpiarPanelLinea();
        noLineaOriginalEnEdicion = clave;

        const codArticulo = linea.codArticulo ?? linea.CodArticulo ?? '';
        const codAlmacen = linea.codAlmacen ?? linea.CodAlmacen ?? '';
        const codigoImpuesto = linea.codigoImpuesto ?? linea.CodigoImpuesto ?? '';

        $('#detNoLineaOriginal').val(clave);
        setArticuloEnAmbasCajas(codArticulo ? { codigo: codArticulo, nombre: linea.descripcion ?? linea.Descripcion ?? '' } : null);

        if (codAlmacen && tipoLineaActual === 'I') {
            const r = await $.get('/OrdenesServicio/ObtenerAlmacenPorCodigo', { codigo: codAlmacen });
            buscadorAlmacen.establecer(r.resultado && r.dato ? r.dato : { codigo: codAlmacen, nombre: codAlmacen });
        } else {
            buscadorAlmacen.establecer(null);
        }

        if (codigoImpuesto) {
            const r = await $.get('/OrdenesServicio/ObtenerImpuestoPorCodigo', { codigo: codigoImpuesto });
            buscadorImpuesto.establecer(r.resultado && r.dato ? r.dato : { codigo: codigoImpuesto, nombre: codigoImpuesto, tasa: 0 });
        } else {
            buscadorImpuesto.establecer(null);
        }

        $('#detDescripcion').val(linea.descripcion ?? linea.Descripcion ?? '');
        $('#detCantidad').val(linea.cantidad ?? linea.Cantidad ?? 1);
        $('#detPrecio').val(linea.precio ?? linea.Precio ?? '');
        $('#detPrctjeDesc').val(linea.prctjeDesc ?? linea.PrctjeDesc ?? 0);

        recalcularLinea();
        mostrarPanelLinea();
    });

    $(document).on('click', '.btn-eliminar-linea', async function () {
        const clave = $(this).data('clave');

        const confirmado = await App.confirmarEliminar(esEdicionDetalle()
            ? 'Se quitará la línea de la orden y, si es un insumo, volverá al inventario.'
            : 'Se quitará la línea de la orden.');
        if (!confirmado) return;

        if (esEdicionDetalle()) {
            const respuesta = await App.eliminar(`/OrdenesServicio/EliminarLinea?entry=${entryActual()}&noLinea=${clave}`);
            if (!respuesta.resultado) {
                App.mostrarError(respuesta.mensaje);
                return;
            }
            App.mostrarExito('Línea eliminada correctamente.');
            await cargarDetalleRemoto();
            await refrescarTotalesServidor();
        } else {
            lineasLocales = lineasLocales.filter(l => l._id !== clave);
            pintarDetalle();
        }
    });

    $(document).on('click', '#btnGuardarLinea', async function () {
        const $boton = $(this);
        const datosForm = App.recolectarFormulario('#formLineaDetalle');
        datosForm.CodArticulo = $('#detCodArticulo').val() || null;
        datosForm.CodigoImpuesto = $('#detCodigoImpuesto').val() || null;

        if (!datosForm.CodArticulo) {
            App.mostrarError('Selecciona un artículo.');
            return;
        }
        if (!(Number(datosForm.Cantidad) > 0)) {
            App.mostrarError('La cantidad debe ser mayor que cero.');
            return;
        }
        if (datosForm.Precio == null || !(Number(datosForm.Precio) >= 0)) {
            App.mostrarError('Indica un precio válido.');
            return;
        }
        if (!datosForm.CodigoImpuesto) {
            App.mostrarError('Selecciona el impuesto.');
            return;
        }
        if (tipoLineaActual === 'I' && !datosForm.CodAlmacen) {
            App.mostrarError('Selecciona el almacén del insumo.');
            return;
        }
        if (tipoLineaActual === 'S') {
            datosForm.CodAlmacen = null;   // el servidor usa el almacén por defecto del artículo, si lo tiene
        }

        if (esEdicionDetalle()) {
            const esEdicionLinea = noLineaOriginalEnEdicion !== null;
            const url = esEdicionLinea
                ? `/OrdenesServicio/EditarLinea?entry=${entryActual()}&noLinea=${noLineaOriginalEnEdicion}`
                : '/OrdenesServicio/CrearLinea';
            const datos = {
                CodArticulo: datosForm.CodArticulo,
                Descripcion: datosForm.Descripcion,
                CodAlmacen: datosForm.CodAlmacen,
                Cantidad: Number(datosForm.Cantidad),
                Precio: Number(datosForm.Precio),
                PrctjeDesc: Number(datosForm.PrctjeDesc) || 0,
                CodigoImpuesto: datosForm.CodigoImpuesto
            };
            if (!esEdicionLinea) datos.Entry = entryActual();

            $boton.prop('disabled', true);
            try {
                const respuesta = await App.enviarJson(url, 'POST', datos);
                if (!respuesta.resultado) {
                    App.mostrarError(respuesta.mensaje);
                    return;
                }
                App.mostrarExito(esEdicionLinea ? 'Línea actualizada correctamente.' : 'Línea agregada correctamente.');
                $('#panelLineaDetalle').addClass('d-none');
                await cargarDetalleRemoto();
                await refrescarTotalesServidor();
            } finally {
                $boton.prop('disabled', false);
            }
        } else {
            if (noLineaOriginalEnEdicion !== null) {
                lineasLocales = lineasLocales.map(l => l._id === noLineaOriginalEnEdicion
                    ? { ...datosForm, _id: l._id, _esInsumo: l._esInsumo }
                    : l);
            } else {
                lineasLocales.push({ ...datosForm, _id: proximoIdLocal++, _esInsumo: tipoLineaActual === 'I' });
            }
            $('#panelLineaDetalle').addClass('d-none');
            pintarDetalle();
        }
    });
});
