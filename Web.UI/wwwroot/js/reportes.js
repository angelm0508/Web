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
            const etiqueta = `<label class="form-label" for="${id}">${escapar(f.titulo)}${f.obligatorio ? ' <span class="text-danger">*</span>' : ''}</label>`;
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

    // ---------- solicitud ----------

    function construirSolicitud() {
        return { filtros: leerFiltros(), columnas: leerColumnas(), orden: leerOrden(), agrupar: [], soloResumen: false };
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
        pintarAvisos(res);
        if (tabla) { tabla.destroy(); tabla = null; }

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

    async function ejecutar() {
        const solicitud = construirSolicitud();
        if (!validarSolicitud(solicitud)) return;

        $('#btnEjecutar').prop('disabled', true);
        const respuesta = await App.enviarJson(`${url.ejecutar}?codigo=${encodeURIComponent(codigo)}`, 'POST', solicitud);
        $('#btnEjecutar').prop('disabled', false);

        if (!respuesta.resultado) {
            App.mostrarError(respuesta.mensaje);
            return;
        }
        pintarResultado(respuesta.dato);
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

        const respuesta = await fetch(`${url.exportar}?codigo=${encodeURIComponent(codigo)}&formato=${encodeURIComponent(formato)}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': App.csrfToken() },
            body: JSON.stringify({ solicitud, graficoPng: null })
        });

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

    // ---------- arranque ----------

    async function iniciar() {
        const respuesta = await $.get(url.definicion, { codigo });
        if (!respuesta.resultado) {
            $('#repResultado').html(`<div class="alert alert-danger mb-0">${escapar(respuesta.mensaje)}</div>`);
            $('#btnEjecutar, .btn-exportar, #btnImprimir').prop('disabled', true);
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
    }

    iniciar();
});
