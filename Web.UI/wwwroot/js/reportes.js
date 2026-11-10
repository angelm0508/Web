// Pantalla genérica de reportes: se arma desde la definición que devuelve la API (filtros, columnas, orden) y trabaja siempre
// con la misma solicitud para ver, exportar e imprimir. Todo texto dinámico se escapa antes de insertarlo en HTML.
$(function () {
    const $raiz = $('#reporte');
    if ($raiz.length === 0) return;

    const codigo = $raiz.data('codigo');
    const url = {
        definicion: $raiz.data('url-definicion'),
        ejecutar: $raiz.data('url-ejecutar'),
        exportar: $raiz.data('url-exportar')
    };

    const escapar = v => $('<div>').text(v ?? '').html().replace(/"/g, '&quot;');
    const esNumerica = c => ['Dinero', 'Cantidad', 'Entero'].includes(c.tipo);
    const MAX_ORDEN = 3;

    let definicion = null;
    let columnasUI = [];          // [{ campo, titulo, tipo, visible }] en el orden que ve el usuario
    let tabla = null;             // DataTable del resultado plano
    let ultimoResultado = null;   // último resultado pintado (de él se arma el gráfico)
    let grafico = null;           // instancia de Chart.js
    let vistas = [];              // vistas guardadas del usuario para este reporte
    let graficoPendiente = null;  // elección de gráfico de una vista aplicada; se usa al pintar el resultado que sigue
    const PALETA = ['#0f766e', '#2563eb', '#d97706', '#dc2626', '#7c3aed', '#059669', '#db2777', '#0891b2', '#65a30d', '#9333ea'];
    const MAX_CATEGORIAS = 30;
    const MAX_PNG_CHARS = 2700000;   // ≈ 2 MB en base64: por encima la API lo rechaza

    // ---------- formato ----------

    function formatoValor(col, v) {
        if (v === null || v === undefined || v === '') return '';
        if (col.tipo === 'Fecha') return String(v).slice(0, 10);
        if (col.tipo === 'Dinero') return Number(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        if (col.tipo === 'Cantidad') return Number(v).toLocaleString('en-US', { maximumFractionDigits: 6 });
        if (col.tipo === 'Entero') return Number(v).toLocaleString('en-US', { maximumFractionDigits: 0 });
        return String(v);
    }

    // ---------- filtros ----------

    const BUSCADORES = {
        Socio: { endpoint: '/Reportes/BuscarSocios', etiqueta: s => `${s.codigo} - ${s.nombre ?? ''}` },
        Articulo: { endpoint: '/Reportes/BuscarArticulos', etiqueta: a => `${a.codigo} - ${a.nombre ?? ''}` },
        Almacen: { endpoint: '/Reportes/BuscarAlmacenes', etiqueta: a => `${a.codigo} - ${a.nombre ?? ''}` }
    };

    function pintarFiltros() {
        const html = definicion.filtros.map(f => {
            const id = `f_${f.campo}`;
            // El label apunta al control visible: en los buscadores es el campo de texto y en el rango, la fecha inicial.
            const paraEtiqueta = BUSCADORES[f.tipo] ? `${id}_texto` : f.tipo === 'RangoFechas' ? `${id}_desde` : id;
            const etiqueta = `<label class="form-label" for="${paraEtiqueta}">${escapar(f.titulo)}${f.obligatorio ? ' <span class="text-danger">*</span>' : ''}</label>`;
            switch (f.tipo) {
                case 'RangoFechas':
                    return `<div class="col-md-6 col-lg-4">${etiqueta}
                        <div class="input-group">
                            <input type="date" class="form-control" id="${id}_desde" aria-label="${escapar(f.titulo)} desde">
                            <span class="input-group-text">a</span>
                            <input type="date" class="form-control" id="${id}_hasta" aria-label="${escapar(f.titulo)} hasta">
                        </div></div>`;
                case 'Fecha':
                    return `<div class="col-md-4 col-lg-3">${etiqueta}<input type="date" class="form-control" id="${id}"></div>`;
                case 'Numero':
                    return `<div class="col-md-4 col-lg-3">${etiqueta}<input type="number" step="any" class="form-control" id="${id}"></div>`;
                case 'Lista': {
                    const opciones = ['<option value="">(Todos)</option>']
                        .concat((f.opciones ?? []).map(o => `<option value="${escapar(o.valor)}">${escapar(o.titulo)}</option>`));
                    return `<div class="col-md-4 col-lg-3">${etiqueta}<select class="form-select" id="${id}">${opciones.join('')}</select></div>`;
                }
                case 'Socio':
                case 'Articulo':
                case 'Almacen':
                    return `<div class="col-md-6 col-lg-4 position-relative">${etiqueta}
                        <input type="text" class="form-control" id="${id}_texto" placeholder="Buscar por código o nombre..." autocomplete="off">
                        <input type="hidden" id="${id}">
                        <div class="invalid-feedback d-none" id="${id}_error">Selecciona una opción de la lista o borra el texto.</div>
                        <ul class="list-group position-absolute w-100 shadow-sm d-none" style="z-index: 1055; max-height: 220px; overflow-y: auto;" id="${id}_lista"></ul>
                    </div>`;
                default:
                    return `<div class="col-md-4 col-lg-3">${etiqueta}<input type="text" class="form-control" id="${id}" maxlength="100"></div>`;
            }
        }).join('');
        $('#repFiltros').html(html);

        definicion.filtros.forEach(f => {
            const id = `f_${f.campo}`;
            if (f.valorPorDefecto && ['Lista', 'Texto', 'Numero', 'Fecha'].includes(f.tipo)) $(`#${id}`).val(f.valorPorDefecto);

            const b = BUSCADORES[f.tipo];
            if (!b) return;
            App.autocompletar({
                texto: $(`#${id}_texto`), oculto: $(`#${id}`), lista: $(`#${id}_lista`), error: $(`#${id}_error`),
                endpoint: b.endpoint,
                obtenerCodigo: x => x.codigo ?? x.Codigo,
                obtenerEtiqueta: b.etiqueta,
                minCaracteres: 0,
                requerido: false,
                parametros: () => (f.tipo === 'Socio' && f.subTipo ? { tipo: f.subTipo } : {})
            });
        });
    }

    // Devuelve los filtros con valor, en la forma de la API. En los buscadores se agrega "texto" (la etiqueta visible), que la API
    // ignora; sirve para encabezados de impresión y vistas guardadas.
    function leerFiltros() {
        const filtros = {};
        definicion.filtros.forEach(f => {
            const id = `#f_${f.campo}`;
            if (f.tipo === 'RangoFechas') {
                const desde = $(`${id}_desde`).val();
                const hasta = $(`${id}_hasta`).val();
                if (desde || hasta) filtros[f.campo] = { desde: desde || null, hasta: hasta || null };
                return;
            }
            const valor = String($(id).val() ?? '').trim();
            if (!valor) return;
            filtros[f.campo] = { valor };
            if (BUSCADORES[f.tipo]) filtros[f.campo].texto = $(`${id}_texto`).val();
        });
        return filtros;
    }

    function textoFiltros() {
        const filtros = leerFiltros();
        const partes = definicion.filtros.filter(f => filtros[f.campo]).map(f => {
            const v = filtros[f.campo];
            if (f.tipo === 'RangoFechas') return `${f.titulo}: ${v.desde ?? '…'} a ${v.hasta ?? '…'}`;
            if (f.tipo === 'Lista') return `${f.titulo}: ${(f.opciones ?? []).find(o => o.valor === v.valor)?.titulo ?? v.valor}`;
            return `${f.titulo}: ${v.texto || v.valor}`;
        });
        return partes.length ? partes.join('; ') : 'Sin filtros';
    }

    // ---------- columnas y orden ----------

    function pintarColumnas() {
        $('#repColumnas').html(columnasUI.map((c, i) => `
            <div class="d-flex align-items-center gap-2 rep-columna">
                <input class="form-check-input rep-col-visible" type="checkbox" id="col_${i}" data-i="${i}" ${c.visible ? 'checked' : ''}>
                <label class="form-check-label flex-grow-1" for="col_${i}">${escapar(c.titulo)}</label>
                <button type="button" class="btn btn-sm btn-link p-0 rep-col-subir" data-i="${i}" title="Subir" ${i === 0 ? 'disabled' : ''}><i class="fa-solid fa-arrow-up"></i></button>
                <button type="button" class="btn btn-sm btn-link p-0 rep-col-bajar" data-i="${i}" title="Bajar" ${i === columnasUI.length - 1 ? 'disabled' : ''}><i class="fa-solid fa-arrow-down"></i></button>
            </div>`).join(''));
    }

    $(document).on('change', '.rep-col-visible', function () {
        columnasUI[Number(this.dataset.i)].visible = this.checked;
    });

    function mover(i, delta) {
        const j = i + delta;
        if (j < 0 || j >= columnasUI.length) return;
        [columnasUI[i], columnasUI[j]] = [columnasUI[j], columnasUI[i]];
        pintarColumnas();
    }
    $(document).on('click', '.rep-col-subir', function () { mover(Number(this.dataset.i), -1); });
    $(document).on('click', '.rep-col-bajar', function () { mover(Number(this.dataset.i), 1); });

    function leerColumnas() {
        return columnasUI.filter(c => c.visible).map(c => c.campo);
    }

    function pintarOrden() {
        const opciones = ['<option value="">(sin orden)</option>']
            .concat(definicion.columnas.map(c => `<option value="${escapar(c.campo)}">${escapar(c.titulo)}</option>`)).join('');
        let html = '';
        for (let i = 0; i < MAX_ORDEN; i++) {
            html += `<div class="input-group input-group-sm mb-2">
                <span class="input-group-text">${i + 1}</span>
                <select class="form-select rep-orden-campo" data-i="${i}" aria-label="Orden ${i + 1}">${opciones}</select>
                <select class="form-select rep-orden-dir" data-i="${i}" aria-label="Sentido ${i + 1}">
                    <option value="asc">Ascendente</option><option value="desc">Descendente</option>
                </select></div>`;
        }
        $('#repOrden').html(html);
    }

    function leerOrden() {
        const orden = [];
        $('.rep-orden-campo').each(function () {
            if (!this.value) return;
            const dir = $(`.rep-orden-dir[data-i="${this.dataset.i}"]`).val();
            orden.push({ campo: this.value, descendente: dir === 'desc' });
        });
        return orden;
    }

    // ---------- agrupación ----------

    const MAX_NIVELES = 2;

    function pintarAgrupacion() {
        const agrupables = definicion.columnas.filter(c => c.agrupable);
        const opciones = ['<option value="">(sin agrupar)</option>']
            .concat(agrupables.map(c => `<option value="${escapar(c.campo)}" data-tipo="${escapar(c.tipo)}">${escapar(c.titulo)}</option>`)).join('');
        let html = '';
        for (let i = 0; i < MAX_NIVELES; i++) {
            html += `<div class="input-group input-group-sm mb-2">
                <span class="input-group-text">${i + 1}</span>
                <select class="form-select rep-agrupar-campo" data-i="${i}" aria-label="Agrupar nivel ${i + 1}">${opciones}</select>
                <select class="form-select rep-agrupar-parte" data-i="${i}" aria-label="Parte de fecha nivel ${i + 1}" disabled>
                    <option value="Dia">Día</option><option value="Mes">Mes</option><option value="Anio">Año</option>
                </select></div>`;
        }
        $('#repAgrupar').html(html);
    }

    // La parte de fecha (día, mes, año) solo se habilita cuando la columna elegida es de tipo Fecha.
    $(document).on('change', '.rep-agrupar-campo', function () {
        const esFecha = $(this).find('option:selected').data('tipo') === 'Fecha';
        $(`.rep-agrupar-parte[data-i="${this.dataset.i}"]`).prop('disabled', !esFecha);
    });

    function leerAgrupacion() {
        const agrupar = [];
        $('.rep-agrupar-campo').each(function () {
            if (!this.value) return;
            const $parte = $(`.rep-agrupar-parte[data-i="${this.dataset.i}"]`);
            const nivel = { campo: this.value };
            if (!$parte.prop('disabled')) nivel.parte = $parte.val();
            agrupar.push(nivel);
        });
        return agrupar;
    }

    // ---------- solicitud ----------

    function construirSolicitud() {
        return {
            filtros: leerFiltros(),
            columnas: leerColumnas(),
            orden: leerOrden(),
            agrupar: leerAgrupacion(),
            soloResumen: $('#repSoloResumen').is(':checked')
        };
    }

    function validarSolicitud(solicitud) {
        if (solicitud.columnas.length === 0) {
            App.mostrarError('Selecciona al menos una columna.');
            return false;
        }
        const faltante = definicion.filtros.find(f => f.obligatorio && !solicitud.filtros[f.campo]);
        if (faltante) {
            App.mostrarError(`El filtro '${faltante.titulo}' es obligatorio.`);
            return false;
        }
        return true;
    }

    // ---------- resultado ----------

    function celdaTotal(col, i, totales) {
        const v = totales[col.campo];
        if (v !== undefined && v !== null) return formatoValor(col, v);
        return i === 0 ? 'Total' : '';
    }

    function pintarAvisos(res) {
        const avisos = [...(res.avisos ?? [])];
        if (res.truncado) avisos.push('El resultado se truncó al máximo de filas: refina los filtros para ver el resto.');
        $('#repAvisos').html(avisos.map(a => `<div class="alert alert-warning py-2">${escapar(a)}</div>`).join(''));
    }

    function pintarResultado(res) {
        ultimoResultado = res;
        pintarAvisos(res);
        if (tabla) { tabla.destroy(); tabla = null; }
        if ((res.grupos ?? []).length > 0) pintarGrupos(res);
        else pintarPlano(res);
        prepararGrafico(res);
    }

    function pintarPlano(res) {
        const cols = res.columnas;
        const thead = `<tr>${cols.map(c => `<th class="${esNumerica(c) ? 'text-end' : ''}">${escapar(c.titulo)}</th>`).join('')}</tr>`;
        const hayTotales = Object.keys(res.totales ?? {}).length > 0;
        const tfoot = hayTotales
            ? `<tfoot><tr class="fw-semibold">${cols.map((c, i) => `<th class="${esNumerica(c) ? 'text-end' : ''}">${escapar(celdaTotal(c, i, res.totales))}</th>`).join('')}</tr></tfoot>`
            : '';

        $('#repResultado').html(`<table id="tblReporte" class="table table-hover table-sm align-middle w-100"><thead>${thead}</thead><tbody></tbody>${tfoot}</table>`);

        tabla = $('#tblReporte').DataTable({
            data: res.filas.map(f => cols.map(c => f[c.campo] ?? null)),
            columns: cols.map(c => ({
                className: esNumerica(c) ? 'text-end' : '',
                render: (d, tipo) => tipo === 'display' ? escapar(formatoValor(c, d)) : (d ?? '')
            })),
            ordering: false,
            pageLength: 25,
            language: App.datatableEsEs
        });
    }

    // Resultado agrupado: tabla simple con una fila de encabezado por grupo, sus filas, y una fila de subtotal; al final el total general.
    function pintarGrupos(res) {
        const cols = res.columnas;
        const filaValores = (valores, clase) =>
            `<tr class="${clase}">${cols.map(c => {
                const v = valores[c.campo];
                const texto = v === undefined || v === null ? '' : formatoValor(c, v);
                return `<td class="${esNumerica(c) ? 'text-end' : ''}">${escapar(texto)}</td>`;
            }).join('')}</tr>`;

        const filasHtml = [];
        const recorrer = (grupos, nivel) => {
            grupos.forEach(g => {
                const sangria = `style="padding-left: ${0.5 + nivel * 1.25}rem"`;
                filasHtml.push(`<tr class="rep-grupo"><td colspan="${cols.length}" ${sangria}>${escapar(g.titulo)}: ${escapar(g.etiqueta)} (${escapar(g.conteo)})</td></tr>`);
                if ((g.hijos ?? []).length > 0) recorrer(g.hijos, nivel + 1);
                else (g.filas ?? []).forEach(f => filasHtml.push(
                    `<tr>${cols.map(c => `<td class="${esNumerica(c) ? 'text-end' : ''}">${escapar(formatoValor(c, f[c.campo]))}</td>`).join('')}</tr>`));
                filasHtml.push(filaValores(g.subtotales ?? {}, 'rep-subtotal'));
            });
        };
        recorrer(res.grupos, 0);
        if (Object.keys(res.totales ?? {}).length > 0) filasHtml.push(filaValores(res.totales, 'rep-total'));

        const thead = `<tr>${cols.map(c => `<th class="${esNumerica(c) ? 'text-end' : ''}">${escapar(c.titulo)}</th>`).join('')}</tr>`;
        $('#repResultado').html(`<table id="tblReporte" class="table table-sm align-middle w-100"><thead>${thead}</thead><tbody>${filasHtml.join('')}</tbody></table>`);
    }

    async function ejecutar() {
        const solicitud = construirSolicitud();
        if (!validarSolicitud(solicitud)) return false;

        $('#btnEjecutar').prop('disabled', true);
        const respuesta = await App.enviarJson(`${url.ejecutar}?codigo=${encodeURIComponent(codigo)}`, 'POST', solicitud);
        $('#btnEjecutar').prop('disabled', false);

        if (!respuesta.resultado) {
            App.mostrarError(respuesta.mensaje);
            return false;
        }
        pintarResultado(respuesta.dato);
        return true;
    }

    // ---------- gráfico ----------

    const FONDO_BLANCO = {
        id: 'fondoBlanco',
        beforeDraw: chart => {
            const ctx = chart.ctx;
            ctx.save();
            ctx.globalCompositeOperation = 'destination-over';
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, chart.width, chart.height);
            ctx.restore();
        }
    };

    function destruirGrafico() {
        if (grafico) { grafico.destroy(); grafico = null; }
        $('#repGraficoContenedor').addClass('d-none');
        $('#repGraficoCard').addClass('no-print');
    }

    // Deja el valor que había en el select si sigue existiendo entre las opciones; si no, queda la primera.
    function conservarSeleccion($select, anterior) {
        if (anterior && $select.find('option').toArray().some(o => o.value === anterior)) $select.val(anterior);
    }

    // Con agrupación las categorías son los grupos del primer nivel; sin ella, una columna de texto o fecha del resultado.
    function prepararGrafico(res) {
        destruirGrafico();
        const agrupado = (res.grupos ?? []).length > 0;
        const columnasValor = res.columnas.filter(c => esNumerica(c));
        const columnasCategoria = agrupado ? [] : res.columnas.filter(c => !esNumerica(c));
        const valorAnterior = $('#repGrafValor').val();
        const categoriaAnterior = $('#repGrafCategoria').val();

        $('#repGrafValor').html(columnasValor.map(c => `<option value="${escapar(c.campo)}">${escapar(c.titulo)}</option>`).join(''));
        $('#repGrafCategoria').html(agrupado
            ? `<option value="">${escapar(res.grupos[0].titulo)} (primer nivel de agrupación)</option>`
            : columnasCategoria.map(c => `<option value="${escapar(c.campo)}">${escapar(c.titulo)}</option>`).join(''))
            .prop('disabled', agrupado);

        // Una vista recién aplicada manda sobre lo que había elegido el usuario.
        if (graficoPendiente) {
            $('#repGrafTipo').val(graficoPendiente.tipo ?? '');
            conservarSeleccion($('#repGrafValor'), graficoPendiente.valor);
            if (!agrupado) conservarSeleccion($('#repGrafCategoria'), graficoPendiente.categoria);
            graficoPendiente = null;
        } else {
            conservarSeleccion($('#repGrafValor'), valorAnterior);
            if (!agrupado) conservarSeleccion($('#repGrafCategoria'), categoriaAnterior);
        }

        if ($('#repGrafTipo').val()) dibujarGrafico();
    }

    function datosGrafico(res, campoCategoria, campoValor) {
        const agregados = new Map();
        if ((res.grupos ?? []).length > 0) {
            res.grupos.forEach(g => agregados.set(g.etiqueta, Number(g.subtotales?.[campoValor] ?? 0)));
        } else {
            const colCat = res.columnas.find(c => c.campo === campoCategoria);
            if (!colCat) return { etiquetas: [], valores: [] };
            res.filas.forEach(f => {
                const etiqueta = formatoValor(colCat, f[campoCategoria]) || '(Sin valor)';
                agregados.set(etiqueta, (agregados.get(etiqueta) ?? 0) + Number(f[campoValor] ?? 0));
            });
        }
        let pares = [...agregados.entries()];
        if (pares.length > MAX_CATEGORIAS) {
            const resto = pares.slice(MAX_CATEGORIAS - 1).reduce((s, [, v]) => s + v, 0);
            pares = pares.slice(0, MAX_CATEGORIAS - 1).concat([['Otros', resto]]);
        }
        return { etiquetas: pares.map(p => p[0]), valores: pares.map(p => p[1]) };
    }

    function dibujarGrafico() {
        destruirGrafico();
        const tipo = $('#repGrafTipo').val();
        if (!tipo || !ultimoResultado) return;

        const campoValor = $('#repGrafValor').val();
        if (!campoValor) return;
        const { etiquetas, valores } = datosGrafico(ultimoResultado, $('#repGrafCategoria').val(), campoValor);
        if (etiquetas.length === 0) return;

        const colValor = ultimoResultado.columnas.find(c => c.campo === campoValor);
        const colores = etiquetas.map((_, i) => PALETA[i % PALETA.length]);
        $('#repGraficoContenedor').removeClass('d-none');
        $('#repGraficoCard').removeClass('no-print');
        grafico = new Chart(document.getElementById('repGrafico'), {
            type: tipo,
            data: {
                labels: etiquetas,
                datasets: [{
                    label: colValor.titulo,
                    data: valores,
                    backgroundColor: tipo === 'line' ? PALETA[0] : colores,
                    borderColor: tipo === 'line' ? PALETA[0] : colores,
                    fill: false
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, animation: false, plugins: { legend: { display: tipo === 'pie' } } },
            plugins: [FONDO_BLANCO]
        });
    }

    $('#repGrafTipo, #repGrafCategoria, #repGrafValor').on('change', dibujarGrafico);

    // PNG del gráfico para el PDF; null si no hay gráfico o pesa demasiado.
    function graficoPng() {
        if (!grafico) return null;
        const png = grafico.toBase64Image('image/png', 1);
        if (png.length > MAX_PNG_CHARS) {
            App.mostrarError('El gráfico es demasiado grande para incluirlo en el PDF; el archivo se genera sin él.');
            return null;
        }
        return png;
    }

    // ---------- exportar e imprimir ----------

    function nombreDeArchivo(disposicion, porDefecto) {
        if (!disposicion) return porDefecto;
        const utf8 = /filename\*=UTF-8''([^;]+)/i.exec(disposicion);
        if (utf8) return decodeURIComponent(utf8[1]);
        const simple = /filename="?([^";]+)"?/i.exec(disposicion);
        return simple ? simple[1] : porDefecto;
    }

    function descargar(blob, nombre) {
        const enlace = document.createElement('a');
        const objeto = URL.createObjectURL(blob);
        enlace.href = objeto;
        enlace.download = nombre;
        document.body.appendChild(enlace);
        enlace.click();
        enlace.remove();
        setTimeout(() => URL.revokeObjectURL(objeto), 1000);
    }

    async function exportar(formato) {
        const solicitud = construirSolicitud();
        if (!validarSolicitud(solicitud)) return;

        let respuesta;
        try {
            respuesta = await fetch(`${url.exportar}?codigo=${encodeURIComponent(codigo)}&formato=${encodeURIComponent(formato)}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': App.csrfToken() },
                body: JSON.stringify({ solicitud, graficoPng: formato === 'pdf' ? graficoPng() : null })
            });
        } catch {
            App.mostrarError('No se pudo conectar con el servidor para generar el archivo.');
            return;
        }

        // Con la sesión vencida el fetch sigue la redirección y recibe la página de inicio de sesión (HTML con estado 200).
        if (respuesta.redirected || (respuesta.headers.get('Content-Type') ?? '').includes('text/html')) {
            App.mostrarError('Tu sesión expiró. Por favor inicia sesión nuevamente.');
            return;
        }

        if (!respuesta.ok) {
            let mensaje = 'No se pudo generar el archivo.';
            try { mensaje = (await respuesta.json()).mensaje ?? mensaje; } catch { /* se deja el mensaje por defecto */ }
            App.mostrarError(mensaje);
            return;
        }
        descargar(await respuesta.blob(), nombreDeArchivo(respuesta.headers.get('Content-Disposition'), `reporte.${formato}`));
    }

    $(document).on('click', '.btn-exportar', function () { exportar(this.dataset.formato); });

    $('#btnImprimir').on('click', function () {
        $('#repEncabezadoImpresion').html(
            `<h4 class="mb-1">${escapar(definicion.nombre)}</h4><div class="small">${escapar(textoFiltros())}</div>
             <div class="small text-muted">Impreso el ${escapar(new Date().toLocaleString('es-GT'))}</div>`);
        // Para imprimir se muestran todas las filas (no solo la página actual de la tabla).
        const paginaAnterior = tabla ? tabla.page.len() : null;
        if (tabla) tabla.page.len(-1).draw();
        window.addEventListener('afterprint', function restaurar() {
            window.removeEventListener('afterprint', restaurar);
            if (tabla && paginaAnterior !== null) tabla.page.len(paginaAnterior).draw();
        });
        window.print();
    });

    $('#btnEjecutar').on('click', ejecutar);

    // ---------- vistas guardadas ----------

    function configuracionActual() {
        return {
            filtros: leerFiltros(),
            columnas: columnasUI.map(c => ({ campo: c.campo, visible: c.visible })),
            orden: leerOrden(),
            agrupar: leerAgrupacion(),
            soloResumen: $('#repSoloResumen').is(':checked'),
            grafico: { tipo: $('#repGrafTipo').val() || '', categoria: $('#repGrafCategoria').val() || '', valor: $('#repGrafValor').val() || '' }
        };
    }

    // Aplica una configuración guardada ignorando lo que ya no existe en la definición.
    function aplicarConfiguracion(config) {
        // filtros
        definicion.filtros.forEach(f => {
            const id = `#f_${f.campo}`;
            const v = config.filtros?.[f.campo];
            if (f.tipo === 'RangoFechas') {
                $(`${id}_desde`).val(v?.desde ?? '');
                $(`${id}_hasta`).val(v?.hasta ?? '');
                return;
            }
            $(id).val(v?.valor ?? (f.valorPorDefecto ?? ''));
            if (BUSCADORES[f.tipo]) {
                $(`${id}_texto`).val(v?.texto ?? '').removeClass('is-invalid');
                $(`${id}_error`).addClass('d-none');
            }
        });

        // columnas: las guardadas primero (en su orden), luego las que la definición tiene y la vista no conocía
        const guardadas = (config.columnas ?? []).filter(g => definicion.columnas.some(c => c.campo === g.campo));
        const nuevas = definicion.columnas.filter(c => !guardadas.some(g => g.campo === c.campo));
        columnasUI = guardadas.map(g => {
            const c = definicion.columnas.find(x => x.campo === g.campo);
            return { campo: c.campo, titulo: c.titulo, tipo: c.tipo, visible: !!g.visible };
        }).concat(nuevas.map(c => ({ campo: c.campo, titulo: c.titulo, tipo: c.tipo, visible: c.visiblePorDefecto })));
        pintarColumnas();

        // orden y agrupación
        $('.rep-orden-campo').each(function () {
            const o = (config.orden ?? [])[Number(this.dataset.i)];
            const existe = o && definicion.columnas.some(c => c.campo === o.campo);
            $(this).val(existe ? o.campo : '');
            $(`.rep-orden-dir[data-i="${this.dataset.i}"]`).val(existe && o.descendente ? 'desc' : 'asc');
        });
        $('.rep-agrupar-campo').each(function () {
            const a = (config.agrupar ?? [])[Number(this.dataset.i)];
            const existe = a && definicion.columnas.some(c => c.campo === a.campo && c.agrupable);
            $(this).val(existe ? a.campo : '').trigger('change');
            if (existe && a.parte) $(`.rep-agrupar-parte[data-i="${this.dataset.i}"]`).val(a.parte);
        });
        $('#repSoloResumen').prop('checked', !!config.soloResumen);

        // gráfico: la categoría y el valor solo se pueden elegir cuando hay resultado; se aplican al pintarlo
        graficoPendiente = config.grafico ?? { tipo: '' };
    }

    function pintarSelectorVistas(seleccionada) {
        $('#repVistas').html(['<option value="">(Vistas guardadas)</option>']
            .concat(vistas.map(v => `<option value="${escapar(v.entry)}">${escapar(v.nombre)}</option>`)).join(''));
        $('#repVistas').val(seleccionada ? String(seleccionada) : '');
        $('#btnBorrarVista').prop('disabled', !$('#repVistas').val());
    }

    async function cargarVistas(seleccionada) {
        try {
            const respuesta = await $.get('/Reportes/Vistas', { codigo });
            vistas = typeof respuesta === 'object' && respuesta !== null && respuesta.resultado && Array.isArray(respuesta.dato) ? respuesta.dato : [];
        } catch {
            vistas = [];
        }
        pintarSelectorVistas(seleccionada);
    }

    $('#repVistas').on('change', async function () {
        $('#btnBorrarVista').prop('disabled', !this.value);
        const vista = vistas.find(v => String(v.entry) === this.value);
        if (!vista) return;
        aplicarConfiguracion(vista.configuracion ?? {});
        if (!await ejecutar()) graficoPendiente = null;
    });

    $('#btnGuardarVista').on('click', async function () {
        const pedido = await Swal.fire({
            title: 'Guardar vista',
            input: 'text',
            inputLabel: 'Nombre de la vista',
            inputAttributes: { maxlength: 100 },
            showCancelButton: true,
            confirmButtonText: 'Guardar',
            cancelButtonText: 'Cancelar',
            inputValidator: v => (!v || !v.trim()) ? 'Escribe un nombre.' : null
        });
        if (!pedido.isConfirmed) return;

        const respuesta = await App.enviarJson(`/Reportes/GuardarVista?codigo=${encodeURIComponent(codigo)}`, 'POST',
            { nombre: pedido.value.trim(), configuracion: configuracionActual() });
        if (!respuesta.resultado) {
            App.mostrarError(respuesta.mensaje);
            return;
        }
        await cargarVistas(respuesta.dato.entry);
        App.mostrarExito('Vista guardada correctamente.');
    });

    $('#btnBorrarVista').on('click', async function () {
        const entry = $('#repVistas').val();
        if (!entry) return;
        if (!await App.confirmarEliminar('La vista se borrará y no se puede deshacer.')) return;

        const respuesta = await App.enviarJson(`/Reportes/EliminarVista?codigo=${encodeURIComponent(codigo)}&entry=${encodeURIComponent(entry)}`, 'POST', {});
        if (!respuesta.resultado) {
            App.mostrarError(respuesta.mensaje);
            return;
        }
        await cargarVistas(null);
        App.mostrarExito('Vista eliminada correctamente.');
    });

    // ---------- arranque ----------

    function falloDeCarga(mensaje) {
        $('#repResultado').html(`<div class="alert alert-danger mb-0">${escapar(mensaje)}</div>`);
        $('#btnEjecutar, .btn-exportar, #btnImprimir, #btnGuardarVista, #btnBorrarVista, #repVistas, #repGrafTipo').prop('disabled', true);
    }

    async function iniciar() {
        let respuesta;
        try {
            respuesta = await $.get(url.definicion, { codigo });
        } catch {
            falloDeCarga('No se pudo cargar el reporte. Revisa tu conexión e inténtalo de nuevo.');
            return;
        }
        // Con la sesión vencida la redirección al inicio de sesión llega como texto HTML, no como JSON.
        if (typeof respuesta !== 'object' || respuesta === null) {
            falloDeCarga('Tu sesión expiró. Por favor inicia sesión nuevamente.');
            return;
        }
        if (!respuesta.resultado || !respuesta.dato) {
            falloDeCarga(respuesta.mensaje || 'No se pudo cargar el reporte.');
            return;
        }
        definicion = respuesta.dato;
        $('#repTitulo').text(definicion.nombre);
        $('#repDescripcion').text(definicion.descripcion);
        document.title = `${definicion.nombre} - Reportes`;

        columnasUI = definicion.columnas.map(c => ({ campo: c.campo, titulo: c.titulo, tipo: c.tipo, visible: c.visiblePorDefecto }));
        pintarFiltros();
        pintarColumnas();
        pintarOrden();
        pintarAgrupacion();
        await cargarVistas(null);
    }

    iniciar();
});
