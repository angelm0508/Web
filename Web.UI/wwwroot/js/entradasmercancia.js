$(function () {
    const tabla = $('#tblEntradasMercancia').DataTable({
        ajax: { url: '/EntradasMercancia/ObtenerTodos', dataSrc: App.dataSrcTabla },
        columns: [
            { data: 'numDoc' },
            { data: 'referencia', render: d => d || '' },
            { data: 'fechaDoc', render: d => d ? new Date(d).toLocaleDateString() : '' },
            {
                data: 'estadoDoc',
                // La cancelación pone Cancelado='S' + EstadoInv='C' pero deja EstadoDoc='A'
                // (semántica de DocStatus de SAP), así que el estado se decide primero por Cancelado.
                render: (d, t, row) => (row && row.cancelado === 'S')
                    ? '<span class="badge text-bg-danger">Cancelado</span>'
                    : (d === 'C' ? '<span class="badge text-bg-secondary">Cancelado</span>' : '<span class="badge text-bg-success">Abierto</span>')
            },
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
        $('#modalFormulario').off('.autocompletar'); // limpia los listeners de la apertura anterior antes de que los buscadores registren los suyos
        new bootstrap.Modal('#modalFormulario').show();
        inicializarSerieEntradaMercancia();
        inicializarDetalle();
    }

    $('#btnNuevo').on('click', async function () {
        const html = await $.get('/EntradasMercancia/FormularioCrear');
        abrirModal(html);
    });

    $('#tblEntradasMercancia').on('click', '.btn-editar', async function () {
        const entry = $(this).data('entry');
        const html = await $.get('/EntradasMercancia/FormularioEditar', { entry });
        abrirModal(html);
    });

    $('#tblEntradasMercancia').on('click', '.btn-eliminar', async function () {
        const entry = $(this).data('entry');
        const confirmado = await App.confirmarEliminar(`Se eliminará la entrada de mercancía #${entry}.`);
        if (!confirmado) return;

        const respuesta = await App.eliminar(`/EntradasMercancia/Eliminar?entry=${entry}`);
        if (!respuesta.resultado) {
            App.mostrarError(respuesta.mensaje);
            return;
        }
        App.mostrarExito('Entrada de mercancía eliminada correctamente.');
        recargarTabla();
    });

    $(document).on('click', '#btnCancelarDocEntradaMercancia', async function () {
        const entry = $(this).data('entry');
        const confirmado = await App.confirmarEliminar('Se cancelará este documento y se revertirá el inventario que ingresó. Esta acción no se puede deshacer.');
        if (!confirmado) return;

        const $btn = $(this).prop('disabled', true);
        try {
            const respuesta = await App.enviarJson(`/EntradasMercancia/Editar?entry=${entry}`, 'POST', { Cancelado: 'S' });
            if (!respuesta.resultado) {
                App.mostrarError(respuesta.mensaje);
                return;
            }
            bootstrap.Modal.getInstance(document.getElementById('modalFormulario')).hide();
            App.mostrarExito('Documento cancelado. El inventario fue revertido.');
            recargarTabla();
        } finally {
            $btn.prop('disabled', false);
        }
    });

    // --- Serie de numeración para generar el número de documento (solo aplica al crear) ---

    function inicializarSerieEntradaMercancia() {
        const $sel = $('#selectSerieEntradaMercancia');
        if ($sel.length === 0) return;

        const datosEl = document.getElementById('datosSeriesEntradaMercancia');
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

    function esSerieManualEntradaMercancia() {
        const $sel = $('#selectSerieEntradaMercancia');
        if ($sel.length === 0 || !$sel.val()) return true;
        return $sel.find('option:selected').data('manual') === 'S';
    }

    function actualizarNumDocSegunSerie() {
        const $numDoc = $('#NumDoc');
        if ($numDoc.length === 0) return;

        if (esSerieManualEntradaMercancia()) {
            $numDoc.val('').prop('disabled', false).attr('placeholder', '');
        } else {
            const sigNumero = $('#selectSerieEntradaMercancia').find('option:selected').data('sig-numero');
            $numDoc.val(sigNumero ?? '').prop('disabled', true).attr('placeholder', 'Se generará al guardar');
        }
    }

    $(document).on('change', '#selectSerieEntradaMercancia', actualizarNumDocSegunSerie);

    $(document).on('click', '#btnGuardarEntradaMercancia', async function () {
        const $boton = $(this);
        const esEdicion = $boton.data('edicion') === true || $boton.data('edicion') === 'true';
        const entry = $boton.data('entry');

        if (!esEdicion) {
            const serieSeleccionada = $('#selectSerieEntradaMercancia').val();
            if (!serieSeleccionada) {
                App.mostrarError('Debes seleccionar una serie.');
                return;
            }
        }

        // El número de documento (No. documento) no se solicita aquí para series no manuales: el
        // servidor lo calcula y avanza el consecutivo al registrar la entrada de mercancía, no
        // antes. Para series Manual, el campo #NumDoc está habilitado y su valor viaja normalmente
        // en recolectarFormulario.
        const datos = App.recolectarFormulario('#formEntradaMercancia');
        if (!esEdicion) {
            datos.Serie = $('#selectSerieEntradaMercancia').val();
        }

        const totales = calcularTotalesDesdeLineas(esEdicionDetalle() ? lineasRemotas : lineasLocales);
        datos.TotalDoc = totales.totalDoc;

        if (!esEdicion) {
            // El alta es atómica y asienta inventario: validar antes de postear para no disparar
            // un rollback profundo dentro de AsentarAsync con un error opaco.
            if (lineasLocales.length === 0) {
                App.mostrarError('Agrega al menos una línea al documento.');
                return;
            }

            const hayLineaSinAlmacen = lineasLocales.some(l => {
                const cantidad = Number(l.Cantidad ?? l.cantidad ?? 0);
                const almacen = l.CodAlmacen ?? l.codAlmacen;
                return cantidad > 0 && !almacen;
            });
            if (hayLineaSinAlmacen) {
                App.mostrarError('Todas las líneas con cantidad deben tener un almacén.');
                return;
            }

            datos.Lineas = lineasLocales.map(({ _id, ...linea }) => linea);

            const respuesta = await App.enviarJson('/EntradasMercancia/Crear', 'POST', datos);
            if (!respuesta.resultado) {
                App.mostrarError(respuesta.mensaje);
                return;
            }

            const sufijoNumDoc = respuesta.numDoc != null ? ` No. documento: ${respuesta.numDoc}.` : '';
            await App.mostrarExito(`Entrada de mercancía creada correctamente.${sufijoNumDoc}`);
            bootstrap.Modal.getInstance(document.getElementById('modalFormulario')).hide();
            recargarTabla();
            return;
        }

        const respuesta = await App.enviarJson(`/EntradasMercancia/Editar?entry=${entry}`, 'POST', datos);
        if (!respuesta.resultado) {
            App.mostrarError(respuesta.mensaje);
            return;
        }

        bootstrap.Modal.getInstance(document.getElementById('modalFormulario')).hide();
        App.mostrarExito('Entrada de mercancía actualizada correctamente.');
        recargarTabla();
    });

    // --- Detalle (grid anidado): en creación se administra localmente; en edición es de solo lectura ---

    let lineasLocales = [];
    let lineasRemotas = [];
    let proximoIdLocal = 1;
    let noLineaOriginalEnEdicion = null;
    let buscadorArticulo, buscadorAlmacen;

    function esEdicionDetalle() {
        const v = $('#tblDetalleEntradaMercancia').data('es-edicion');
        return v === true || v === 'true';
    }

    function inicializarDetalle() {
        lineasLocales = [];
        lineasRemotas = [];
        proximoIdLocal = 1;
        noLineaOriginalEnEdicion = null;

        const $tabla = $('#tblDetalleEntradaMercancia');
        if ($tabla.length === 0) return;

        buscadorArticulo = App.autocompletar({
            texto: $('#detCodArticuloTexto'), oculto: $('#detCodArticulo'),
            lista: $('#detCodArticuloResultados'), error: $('#detCodArticuloError'),
            endpoint: '/EntradasMercancia/BuscarArticulos',
            obtenerCodigo: a => a.codigo ?? a.Codigo,
            obtenerEtiqueta: a => `${a.codigo ?? a.Codigo} - ${a.nombre ?? a.Nombre}`,
            onSeleccion: async a => {
                if (!a) return;
                $('#detDescripcion').val(a.nombre ?? a.Nombre ?? '');
                // Costo unitario sugerido = costo promedio del artículo. El buscador de artículos
                // no siempre expone un campo de costo; cuando no lo trae, queda en 0 y el usuario
                // lo captura a mano (el campo es editable).
                $('#detCostoUnitario').val(a.costoPromedio ?? a.CostoPromedio ?? 0);
                // No se escribe el <input> del buscador de Almacén directamente -- hay que pasar
                // por buscadorAlmacen.establecer() para que su estado interno ("resuelto") quede
                // consistente.
                const almacenDefecto = a.almacenDefecto ?? a.AlmacenDefecto ?? '';
                if (almacenDefecto) {
                    const respuestaAlmacen = await $.get('/EntradasMercancia/ObtenerAlmacenPorCodigo', { codigo: almacenDefecto });
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
            endpoint: '/EntradasMercancia/BuscarAlmacenes',
            obtenerCodigo: al => al.codigo ?? al.Codigo,
            obtenerEtiqueta: al => `${al.codigo ?? al.Codigo} - ${al.nombre ?? al.Nombre}`
        });

        if (esEdicionDetalle()) {
            cargarDetalleRemoto();
        } else {
            pintarDetalle();
        }
    }

    async function cargarDetalleRemoto() {
        const entry = $('#tblDetalleEntradaMercancia').data('entry');
        const respuesta = await $.get('/EntradasMercancia/ObtenerDetalle', { entry });
        lineasRemotas = (respuesta.resultado && respuesta.dato) ? respuesta.dato : [];
        pintarDetalle();
    }

    function calcularTotalesDesdeLineas(lista) {
        let totalDoc = 0;
        lista.forEach(l => {
            const cantidad = Number(l.cantidad ?? l.Cantidad ?? 0);
            const costo = Number(l.costoUnitario ?? l.CostoUnitario ?? 0);
            totalDoc += cantidad * costo;
        });
        return { totalDoc: totalDoc.toFixed(2) };
    }

    function pintarDetalle() {
        const $tbody = $('#tblDetalleEntradaMercancia tbody');
        if ($tbody.length === 0) return;

        const lista = esEdicionDetalle() ? lineasRemotas : lineasLocales;

        const totales = calcularTotalesDesdeLineas(lista);
        $('#TotalDoc').val(totales.totalDoc);

        if (lista.length === 0) {
            $tbody.html('<tr><td colspan="6" class="text-center text-muted">Sin líneas de detalle</td></tr>');
            return;
        }

        $tbody.html(lista.map(linea => {
            const codArticulo = linea.codArticulo ?? linea.CodArticulo;
            const descripcion = linea.descripcion ?? linea.Descripcion;
            const cantidad = linea.cantidad ?? linea.Cantidad;
            const costoUnitario = linea.costoUnitario ?? linea.CostoUnitario;
            const cant = Number(cantidad ?? 0);
            const costo = Number(costoUnitario ?? 0);
            const totalLinea = linea.totalLinea ?? linea.TotalLinea ?? (cant * costo);
            const clave = esEdicionDetalle() ? (linea.noLinea ?? linea.NoLinea) : linea._id;
            // En edición el documento ya está asentado: las líneas son de solo lectura
            // (la API ignora cualquier cambio salvo Comentario/Cancelado), así que no se
            // pintan los botones de editar/eliminar por fila.
            const acciones = esEdicionDetalle() ? '' : `
                        <button type="button" class="btn btn-sm btn-outline-primary btn-editar-linea" data-clave="${clave}"><i class="fa-solid fa-pen"></i></button>
                        <button type="button" class="btn btn-sm btn-outline-danger btn-eliminar-linea" data-clave="${clave}"><i class="fa-solid fa-trash"></i></button>`;
            return `
                <tr>
                    <td>${codArticulo ?? ''}</td>
                    <td>${descripcion ?? ''}</td>
                    <td>${cantidad ?? ''}</td>
                    <td>${costoUnitario != null ? Number(costoUnitario).toFixed(2) : ''}</td>
                    <td>${totalLinea != null ? Number(totalLinea).toFixed(2) : ''}</td>
                    <td class="text-end">${acciones}</td>
                </tr>
            `;
        }).join(''));
    }

    function limpiarPanelLinea() {
        $('#detNoLineaOriginal').val('');
        buscadorArticulo.establecer(null);
        buscadorAlmacen.establecer(null);
        $('#detDescripcion').val('');
        $('#detCantidad').val('1');
        $('#detCostoUnitario').val('');
        $('#detTotalLinea').val('');
        noLineaOriginalEnEdicion = null;
    }

    /** Recalcula el total de la línea: Cantidad x Costo unitario. */
    function recalcularLinea() {
        const cantidad = Number($('#detCantidad').val()) || 0;
        const costo = Number($('#detCostoUnitario').val()) || 0;
        $('#detTotalLinea').val((cantidad * costo).toFixed(2));
    }

    $(document).on('input change', '#detCantidad, #detCostoUnitario', recalcularLinea);

    $(document).on('click', '#btnNuevaLinea', function () {
        limpiarPanelLinea();
        $('#panelLineaDetalle').removeClass('d-none');
    });

    $(document).on('click', '#btnCancelarLinea', function () {
        $('#panelLineaDetalle').addClass('d-none');
    });

    $(document).on('click', '.btn-editar-linea', function () {
        const clave = $(this).data('clave');
        const linea = lineasLocales.find(l => l._id === clave);
        if (!linea) return;

        limpiarPanelLinea();
        noLineaOriginalEnEdicion = clave;
        $('#detNoLineaOriginal').val(clave);

        const codArticulo = linea.CodArticulo ?? linea.codArticulo ?? '';
        buscadorArticulo.establecer(codArticulo ? { codigo: codArticulo, nombre: linea.Descripcion ?? linea.descripcion ?? '' } : null);

        const codAlmacen = linea.CodAlmacen ?? linea.codAlmacen ?? '';
        if (codAlmacen) {
            $.get('/EntradasMercancia/ObtenerAlmacenPorCodigo', { codigo: codAlmacen }).then(respuestaAlmacen => {
                buscadorAlmacen.establecer(respuestaAlmacen.resultado && respuestaAlmacen.dato ? respuestaAlmacen.dato : { codigo: codAlmacen, nombre: codAlmacen });
            });
        } else {
            buscadorAlmacen.establecer(null);
        }

        $('#detDescripcion').val(linea.Descripcion ?? linea.descripcion ?? '');
        $('#detCantidad').val(linea.Cantidad ?? linea.cantidad ?? 1);
        $('#detCostoUnitario').val(linea.CostoUnitario ?? linea.costoUnitario ?? '');

        recalcularLinea();
        $('#panelLineaDetalle').removeClass('d-none');
    });

    $(document).on('click', '.btn-eliminar-linea', async function () {
        const clave = $(this).data('clave');

        const confirmado = await App.confirmarEliminar('Se eliminará la línea de detalle seleccionada.');
        if (!confirmado) return;

        lineasLocales = lineasLocales.filter(l => l._id !== clave);
        pintarDetalle();
    });

    $(document).on('click', '#btnGuardarLinea', function () {
        const datosForm = App.recolectarFormulario('#formLineaDetalle');
        datosForm.CodArticulo = $('#detCodArticulo').val() || null;

        if (!datosForm.CodArticulo) {
            App.mostrarError('Selecciona un artículo.');
            return;
        }

        if (noLineaOriginalEnEdicion !== null) {
            lineasLocales = lineasLocales.map(l => l._id === noLineaOriginalEnEdicion ? { ...datosForm, _id: l._id } : l);
        } else {
            lineasLocales.push({ ...datosForm, _id: proximoIdLocal++ });
        }

        $('#panelLineaDetalle').addClass('d-none');
        pintarDetalle();
    });
});
