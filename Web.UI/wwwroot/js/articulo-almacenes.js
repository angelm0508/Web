/**
 * Sección "Datos de inventario" de la ficha del artículo (modal de edición y página "Nuevo"):
 * tabla de stock por almacén con mínimo, máximo y bloqueo editables, al estilo de SAP B1.
 *
 * Módulo global ArticuloAlmacenes:
 *   cargar(contenedor, codigoOUrl) pide las filas por AJAX y pinta la tabla en el contenedor.
 *       codigoOUrl: código del artículo (-> /Articulos/Almacenes?codigo=) o una URL que empiece con "/"
 *       (p. ej. /Articulos/AlmacenesNuevo para un artículo que aún no existe).
 *   recolectar() devuelve [{ codAlmacen, minimo, maximo, bloqueado }] de todas las filas.
 *   validar() marca los errores por fila y devuelve true/false.
 *   guardar(codigo) guarda la configuración (POST /Articulos/GuardarAlmacenes) y devuelve la Respuesta;
 *       devuelve { resultado: true } sin llamar a la API si no hay tabla cargada o no hay nada configurado.
 *
 * Los estados y el nivel necesario se recalculan en el navegador con las mismas fórmulas que
 * StockAlmacenCalculadora de la API (cero o vacío = "sin valor").
 */
const ArticuloAlmacenes = (function () {
    const URL_ALMACENES = '/Articulos/Almacenes?codigo=';
    const URL_GUARDAR = '/Articulos/GuardarAlmacenes?codigo=';
    const DECIMALES = 1e6; // 6 decimales, como decimal(19,6)
    // Máximo de decimal(19,6): 13 enteros y 6 decimales. Como double 9999999999999.999999 es igual a 1e13 (no hay precisión
    // para tanto), un valor de exactamente 1e13 pasa aquí y lo rechaza la API con su propio mensaje.
    const LIMITE = 9999999999999.999999;
    const SELECTOR_TIPO = '#ArticuloInventario';

    const esc = t => String(t ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const num = n => (n == null ? '' : Number(n).toFixed(6).replace(/\.?0+$/, '')) || '0';
    const redondear = n => Math.round(n * DECIMALES) / DECIMALES;

    let $contenedor = $();
    let filas = [];               // filas tal como llegaron de la API (stock de solo lectura)
    let cargado = false;          // true solo si la tabla se pintó con datos reales de la API
    let habiaConfiguracion = false; // si al cargar ya había mínimo, máximo o bloqueo (para poder borrarlos al guardar)
    let solicitud = 0;            // descarta respuestas de cargas anteriores (reaperturas rápidas del modal)

    // ---- Fórmulas (idénticas a StockAlmacenCalculadora de la API) ----

    function estadoDe(enStock, minimo, maximo) {
        if (minimo > 0 && enStock < minimo) return 'BAJO_MINIMO';
        if (maximo > 0 && enStock > maximo) return 'SOBRE_MAXIMO';
        return 'OK';
    }

    function nivelNecesarioDe(maximo, disponible) {
        if (!(maximo > 0)) return null;
        return Math.max(0, redondear(maximo - disponible));
    }

    function claseDeEstado(estado) {
        return estado === 'BAJO_MINIMO' ? 'inv-alm-bajo' : estado === 'SOBRE_MAXIMO' ? 'inv-alm-sobre' : '';
    }

    function leerNumero($input) {
        const v = $input.val();
        return v === '' || v == null ? null : Number(v);
    }

    function esNumeroInvalido($input) {
        const el = $input[0];
        return !!(el && el.validity && el.validity.badInput);
    }

    function estaConfigurada(f) {
        return (f.minimo != null && f.minimo !== 0) || (f.maximo != null && f.maximo !== 0) || f.bloqueado === true;
    }

    // ---- Pintado ----

    function htmlFila(f, i) {
        const minimo = f.minimo != null && f.minimo !== 0 ? num(f.minimo) : '';
        const maximo = f.maximo != null && f.maximo !== 0 ? num(f.maximo) : '';
        const nivel = nivelNecesarioDe(f.maximo, f.disponible);
        const etiqueta = esc(f.codAlmacen);
        return `
            <tr class="inv-alm-fila ${claseDeEstado(f.estado)}" data-i="${i}">
                <td class="text-muted">${i + 1}</td>
                <td class="font-mono">${etiqueta}</td>
                <td>${esc(f.nombreAlmacen)}</td>
                <td class="text-center"><input type="checkbox" class="form-check-input inv-alm-bloq" ${f.bloqueado ? 'checked' : ''} aria-label="Bloqueado en ${etiqueta}" /></td>
                <td class="text-end inv-alm-ro">${num(f.enStock)}</td>
                <td class="text-end inv-alm-ro">${num(f.comprometido)}</td>
                <td class="text-end inv-alm-ro">${num(f.pedido)}</td>
                <td class="text-end inv-alm-ro">${num(f.disponible)}</td>
                <td><input type="number" step="0.000001" min="0" class="form-control form-control-sm text-end inv-alm-min" value="${esc(minimo)}" aria-label="Stock mínimo en ${etiqueta}" /></td>
                <td><input type="number" step="0.000001" min="0" class="form-control form-control-sm text-end inv-alm-max" value="${esc(maximo)}" aria-label="Stock máximo en ${etiqueta}" /></td>
                <td class="text-end inv-alm-ro inv-alm-nivel">${nivel == null ? '' : num(nivel)}</td>
            </tr>
            <tr class="inv-alm-msg d-none"><td></td><td colspan="10" class="text-danger small"></td></tr>`;
    }

    function pintar(datos) {
        filas = datos;
        if (filas.length === 0) {
            $contenedor.html('<p class="small text-muted mb-0">No hay almacenes para mostrar.</p>');
            return;
        }

        const suma = campo => redondear(filas.reduce((total, f) => total + Number(f[campo] ?? 0), 0));
        $contenedor.html(`
            <div class="table-responsive">
                <table class="table table-sm table-bordered align-middle mb-0 inv-alm">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Código de almacén</th>
                            <th>Nombre del almacén</th>
                            <th class="text-center">Bloqueado</th>
                            <th class="text-end">En stock</th>
                            <th class="text-end">Comprometido</th>
                            <th class="text-end">Pedido</th>
                            <th class="text-end">Disponible</th>
                            <th class="text-end">Stock mínimo</th>
                            <th class="text-end">Stock máximo</th>
                            <th class="text-end">Nivel de stock necesario</th>
                        </tr>
                    </thead>
                    <tbody>${filas.map(htmlFila).join('')}</tbody>
                    <tfoot>
                        <tr class="fw-semibold">
                            <td colspan="4" class="text-end">Totales</td>
                            <td class="text-end inv-alm-ro">${num(suma('enStock'))}</td>
                            <td class="text-end inv-alm-ro">${num(suma('comprometido'))}</td>
                            <td class="text-end inv-alm-ro">${num(suma('pedido'))}</td>
                            <td class="text-end inv-alm-ro">${num(suma('disponible'))}</td>
                            <td colspan="3"></td>
                        </tr>
                    </tfoot>
                </table>
            </div>
            <p class="small text-muted mt-2 mb-0">
                <span class="inv-alm-leyenda inv-alm-bajo"></span> Bajo el mínimo
                <span class="inv-alm-leyenda inv-alm-sobre ms-3"></span> Sobre el máximo
                &middot; Cero o vacío = sin nivel. Los avisos no bloquean ningún movimiento.
            </p>
            <p class="small text-muted mt-2 mb-0 inv-alm-servicio d-none">Un servicio no mueve inventario: la configuración por almacén no aplica.</p>`);
    }

    // Recalcula el nivel necesario y el color de una fila al editar su mínimo o máximo.
    function recalcularFila($fila) {
        const f = filas[Number($fila.data('i'))];
        if (!f) return;
        const minimo = leerNumero($fila.find('.inv-alm-min'));
        const maximo = leerNumero($fila.find('.inv-alm-max'));
        const nivel = nivelNecesarioDe(maximo, f.disponible);
        $fila.find('.inv-alm-nivel').text(nivel == null ? '' : num(nivel));
        $fila.removeClass('inv-alm-bajo inv-alm-sobre').addClass(claseDeEstado(estadoDe(f.enStock, minimo, maximo)));
    }

    function limpiarError($fila) {
        $fila.find('.inv-alm-min, .inv-alm-max').removeClass('is-invalid');
        $fila.next('.inv-alm-msg').addClass('d-none').children().last().text('');
    }

    function marcarError($fila, mensaje, campos) {
        $fila.find(campos).addClass('is-invalid');
        $fila.next('.inv-alm-msg').removeClass('d-none').children().last().text(mensaje);
    }

    // Un artículo de servicio (#ArticuloInventario = 'N') no mueve inventario: se deshabilita la configuración por almacén,
    // pero los valores se conservan y recolectar() los sigue leyendo (los inputs deshabilitados no se serializan en un
    // formulario, por eso se leen directamente).
    function aplicarServicio() {
        const $tipo = $(SELECTOR_TIPO);
        const esServicio = $tipo.length > 0 && $tipo.val() === 'N';
        $contenedor.find('.inv-alm-bloq, .inv-alm-min, .inv-alm-max').prop('disabled', esServicio);
        $contenedor.find('.inv-alm-servicio').toggleClass('d-none', !esServicio);
        if (esServicio) $contenedor.find('tr.inv-alm-fila').each(function () { limpiarError($(this)); });
    }

    // ---- API pública ----

    async function cargar(contenedor, codigoOUrl) {
        $contenedor = $(contenedor);
        cargado = false;
        habiaConfiguracion = false;
        filas = [];
        if ($contenedor.length === 0) return;

        const id = ++solicitud;
        $contenedor.html('<p class="small text-muted mb-0">Cargando almacenes...</p>');

        const texto = String(codigoOUrl ?? '');
        const url = texto.startsWith('/') ? texto : URL_ALMACENES + encodeURIComponent(texto);

        let respuesta;
        try {
            respuesta = await $.get(url);
        } catch (e) {
            respuesta = { resultado: false, mensaje: 'No se pudo conectar con el servidor.' };
        }
        if (id !== solicitud) return; // llegó una carga más reciente

        if (!respuesta || !respuesta.resultado) {
            $contenedor.html(`<div class="alert alert-warning py-2 px-3 small mb-0">No se pudo cargar el inventario por almacén: ${esc((respuesta && respuesta.mensaje) || 'error desconocido')}</div>`);
            return;
        }

        const datos = respuesta.dato || [];
        habiaConfiguracion = datos.some(estaConfigurada);
        pintar(datos);
        aplicarServicio();
        cargado = true;
    }

    function recolectar() {
        if (!cargado) return [];
        return $contenedor.find('tr.inv-alm-fila').map(function () {
            const $fila = $(this);
            const f = filas[Number($fila.data('i'))];
            return {
                codAlmacen: f.codAlmacen,
                minimo: leerNumero($fila.find('.inv-alm-min')),
                maximo: leerNumero($fila.find('.inv-alm-max')),
                bloqueado: $fila.find('.inv-alm-bloq').prop('checked')
            };
        }).get();
    }

    function validar() {
        if (!cargado) return true;
        let primero = null;

        $contenedor.find('tr.inv-alm-fila').each(function () {
            const $fila = $(this);
            limpiarError($fila);

            const $min = $fila.find('.inv-alm-min');
            const $max = $fila.find('.inv-alm-max');
            // Un artículo de servicio deshabilita la sección: sus filas no se validan.
            if ($min.prop('disabled') && $max.prop('disabled')) return;
            const minimo = leerNumero($min);
            const maximo = leerNumero($max);

            let mensaje = null;
            let campos = '.inv-alm-min, .inv-alm-max';
            // Un texto que el navegador no puede convertir en número (p. ej. «1e999») queda con val() vacío y badInput.
            if (esNumeroInvalido($min)) { mensaje = 'El valor no es un número válido.'; campos = '.inv-alm-min'; }
            else if (esNumeroInvalido($max)) { mensaje = 'El valor no es un número válido.'; campos = '.inv-alm-max'; }
            else if (minimo != null && minimo < 0) { mensaje = 'El stock mínimo no puede ser negativo.'; campos = '.inv-alm-min'; }
            else if (maximo != null && maximo < 0) { mensaje = 'El stock máximo no puede ser negativo.'; campos = '.inv-alm-max'; }
            else if (minimo != null && minimo > LIMITE) { mensaje = 'No puede superar 9,999,999,999,999.999999.'; campos = '.inv-alm-min'; }
            else if (maximo != null && maximo > LIMITE) { mensaje = 'No puede superar 9,999,999,999,999.999999.'; campos = '.inv-alm-max'; }
            else if (minimo != null && redondear(minimo) !== minimo) { mensaje = 'El stock mínimo admite como máximo 6 decimales.'; campos = '.inv-alm-min'; }
            else if (maximo != null && redondear(maximo) !== maximo) { mensaje = 'El stock máximo admite como máximo 6 decimales.'; campos = '.inv-alm-max'; }
            // Cero es "sin valor": solo se compara cuando ambos niveles tienen valor.
            else if (minimo > 0 && maximo > 0 && maximo < minimo) { mensaje = 'El stock máximo no puede ser menor que el mínimo.'; campos = '.inv-alm-max'; }

            if (mensaje) {
                marcarError($fila, mensaje, campos);
                if (!primero) primero = $fila;
            }
        });

        if (primero) primero[0].scrollIntoView({ block: 'center', behavior: 'smooth' });
        return primero === null;
    }

    async function guardar(codigo) {
        if (!cargado) return { resultado: true };

        const datos = recolectar();
        // Sin nada configurado (ni ahora ni al cargar) no hay nada que guardar ni que borrar: se omite la llamada.
        if (!habiaConfiguracion && !datos.some(estaConfigurada)) return { resultado: true };

        const respuesta = await App.enviarJson(URL_GUARDAR + encodeURIComponent(codigo), 'POST', datos);
        if (respuesta && respuesta.resultado) {
            habiaConfiguracion = datos.some(estaConfigurada);
        }
        return respuesta;
    }

    // Eventos delegados en el documento: el contenedor se vuelve a crear cada vez que se abre el modal.
    $(document).on('input', '#inventarioAlmacenes .inv-alm-min, #inventarioAlmacenes .inv-alm-max', function () {
        const $fila = $(this).closest('tr.inv-alm-fila');
        limpiarError($fila);
        recalcularFila($fila);
    });

    $(document).on('change', SELECTOR_TIPO, aplicarServicio);

    return { cargar, recolectar, validar, guardar };
})();
