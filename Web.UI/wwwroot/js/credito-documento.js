// Crédito del cliente en los formularios de pedido, entrega y factura de venta.
// Lo comparten pedidos.js, entregas.js y facturas.js.
//
// Informativo: al elegir el cliente muestra «Disponible: X» («Sin límite» / «Solo contado») en #creditoDisponible y,
// si el documento parece pasarse del disponible o el cliente tiene vencido con bloqueo, un aviso. El control real es
// el de la API: al guardar, un rechazo por crédito (HTTP 409, respuesta.credito) abre un diálogo con las cifras y, a quien
// tiene el permiso AutorizarExcesoCredito, ofrece «Autorizar y guardar», que reenvía el MISMO documento con
// AutorizarExcesoCredito = true. Esa bandera solo se envía desde esa confirmación (CreditoDoc.enviar).
//
// El servidor del formulario entrega los permisos en <script id="datosCredito" type="application/json">
// ({ puedeVerCredito, puedeAutorizar }); sin ese bloque (formularios de edición ya asentados) el módulo queda inactivo.
// Sin el permiso EstadoCuenta/Ver no se consulta ni se muestra nada (y la acción del servidor también lo exige).
window.CreditoDoc = (function () {
    const URL_POSICION = '/CreditoCliente/PosicionCredito';

    const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const r2 = n => Math.round((Number(n) + Number.EPSILON) * 100) / 100;
    // Importes: 2 decimales y separador de miles, como el resto de la interfaz de crédito y saldos.
    const dinero = n => Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    let cfg = { tipo: '', urlPosicion: URL_POSICION, puedeAutorizar: false, puedeVerCredito: false, comparaTotal: true };
    let posicion = null;   // PosicionCreditoDTO del cliente elegido (camelCase); null si no hay o no se pudo consultar
    let total = 0;         // total del documento
    let base = 0;          // parte del total que viene de pedidos/entregas ya contados como comprometidos ("Copiar a")
    let pago = 0;          // pago inmediato (facturas)
    let solicitud = 0;     // descarta las respuestas de consultas viejas

    function leerDatos() {
        const el = document.getElementById('datosCredito');
        if (!el) return {};
        try { return JSON.parse(el.textContent) || {}; } catch (e) { return {}; }
    }

    // ---- lógica pura (sin DOM) ----

    /** Monto que el documento sumaría a la exposición, estimado en pantalla: total menos lo ya comprometido y el pago inmediato. */
    function montoEstimado(t, b, p) {
        return Math.max(0, r2((Number(t) || 0) - (Number(b) || 0) - (Number(p) || 0)));
    }

    /** Disponible del cliente (null sin límite); lo calcula si la respuesta no lo trae. */
    function disponibleDe(p) {
        if (p.limite == null) return null;
        if (p.disponible != null) return Number(p.disponible);
        return r2(Number(p.limite) - Number(p.exposicion ?? ((Number(p.saldo) || 0) + (Number(p.comprometido) || 0))));
    }

    /** Texto de la línea «Disponible» y si va en rojo. */
    function textoDisponible(p) {
        if (p.limite == null) return { texto: 'Sin límite', negativo: false };
        if (Number(p.limite) === 0) return { texto: 'Solo contado', negativo: false };
        const d = disponibleDe(p);
        return { texto: `Disponible: ${dinero(d)}`, negativo: d < 0 };
    }

    /** Avisos informativos para la posición y el documento actual. */
    function avisosDe(p, t, b, pg, comparaTotal) {
        const avisos = [];
        if (p.bloquearSiVencido && Number(p.vencido) > 0)
            avisos.push(`El cliente tiene saldo vencido de ${dinero(p.vencido)} y está bloqueado para nuevos documentos.`);
        if (comparaTotal && p.limite != null) {
            const monto = montoEstimado(t, b, pg);
            const disponible = disponibleDe(p);
            if (monto > 0 && monto > disponible) {
                if (Number(p.limite) === 0)
                    avisos.push(`Cliente solo de contado: el documento (${dinero(monto)}) requiere pago al facturar.`);
                else
                    avisos.push(`El documento (${dinero(monto)}) supera el disponible del cliente (${dinero(disponible)}). El sistema podría rechazarlo al guardar.`);
            }
        }
        return avisos;
    }

    /** HTML del contenedor «Disponible» (todo el texto dinámico escapado). */
    function htmlResumen(p, t, b, pg, comparaTotal) {
        if (!p) return '';
        const d = textoDisponible(p);
        const detalle = `Límite: ${p.limite == null ? 'sin límite' : dinero(p.limite)} · Saldo: ${dinero(p.saldo)} · Comprometido: ${dinero(p.comprometido)} · Vencido: ${dinero(p.vencido)}`;
        let html = `<span class="${d.negativo ? 'text-danger fw-semibold' : 'text-muted'}" title="${esc(detalle)}">${esc(d.texto)}</span>`;
        avisosDe(p, t, b, pg, comparaTotal).forEach(a => {
            html += `<div class="alert alert-warning py-1 px-2 mt-1 mb-0 small">${esc(a)}</div>`;
        });
        return html;
    }

    /**
     * Configuración de SweetAlert2 para un rechazo por crédito. Con permiso para autorizar lleva «Autorizar y guardar»
     * (y Cancelar con el foco, para que Enter no autorice sin querer); sin permiso, solo «Cerrar».
     * contexto.pagoInmediato > 0 (facturas) agrega la nota de que el pago inmediato ya se descontó.
     * Si c.oculto (el Web quitó las cifras porque el usuario no tiene EstadoCuenta/Ver) no se pinta la tabla de cifras.
     */
    function opcionesDialogo(respuesta, c, puedeAutorizar, contexto, tipo) {
        const fila = (etiqueta, valor, clase) => `<tr><th class="fw-normal text-start">${esc(etiqueta)}</th><td class="text-end ${clase || ''}">${esc(dinero(valor))}</td></tr>`;
        const esVencido = c.codigo === 'CLIENTE_CON_VENCIDO';
        const oculto = c.oculto === true;
        let filas = '';
        if (oculto) {
            // sin cifras: solo el mensaje genérico que manda el servidor
        } else if (esVencido) {
            filas += fila('Saldo vencido', c.vencido, 'text-danger fw-semibold');
            filas += fila('Monto del documento', c.monto);
        } else {
            if (c.limite != null) filas += fila('Límite de crédito', c.limite);
            filas += fila('Saldo', c.saldo);
            filas += fila('Comprometido en pedidos y entregas', c.comprometido);
            filas += fila('Monto del documento', c.monto);
            filas += fila('Exceso', c.exceso, 'text-danger fw-semibold');
        }
        const mensaje = (respuesta && respuesta.mensaje)
            || (oculto ? (esVencido ? 'El cliente tiene saldo vencido y está bloqueado para nuevos documentos.' : 'El cliente excede su límite de crédito.')
                : esVencido ? `El cliente tiene saldo vencido de ${dinero(c.vencido)}.` : 'El documento excede el límite de crédito del cliente.');
        let html = `<div class="text-start"><p>${esc(mensaje)}</p>`;
        if (!oculto && c.limite != null && Number(c.limite) === 0)
            html += '<p>Este cliente es solo de contado: no se le puede fiar.</p>';
        if (filas)
            html += `<table class="table table-sm mb-2"><tbody>${filas}</tbody></table>`;
        if (Number(contexto && contexto.pagoInmediato) > 0)
            html += '<p class="small text-muted mb-1">El pago inmediato ya se descontó del monto a controlar.</p>';
        const articulo = { pedido: 'el pedido', entrega: 'la entrega', factura: 'la factura' }[tipo] || 'el documento';
        html += puedeAutorizar
            ? `<p class="small text-muted mb-0">Si autorizas, ${esc(articulo)} se guarda y la autorización queda registrada a tu nombre.</p>`
            : '<p class="small text-muted mb-0">No tienes permiso para autorizar excesos de crédito.</p>';
        html += '</div>';

        return {
            icon: 'warning',
            title: esVencido ? 'Cliente con saldo vencido' : 'Límite de crédito excedido',
            html,
            showCancelButton: puedeAutorizar,
            confirmButtonText: puedeAutorizar ? 'Autorizar y guardar' : 'Cerrar',
            cancelButtonText: 'Cancelar',
            focusCancel: puedeAutorizar
        };
    }

    // ---- interfaz ----

    function pintar() {
        const el = document.getElementById('creditoDisponible');
        if (!el) return;
        el.innerHTML = cfg.puedeVerCredito ? htmlResumen(posicion, total, base, pago, cfg.comparaTotal) : '';
    }

    /**
     * Llamar al abrir el formulario. opciones: { tipo: 'pedido'|'entrega'|'factura', comparaTotal?: false (edición de pedido:
     * el pedido ya está contado, no se compara el total), urlPosicion?, puedeAutorizar?, puedeVerCredito? }; los permisos
     * salen de #datosCredito si no se pasan. Si el formulario ya trae cliente ("Copiar a", pedido en edición) consulta de una vez.
     */
    function inicializar(opciones) {
        const o = opciones || {};
        const datos = leerDatos();
        cfg = {
            tipo: o.tipo || '',
            urlPosicion: o.urlPosicion || URL_POSICION,
            puedeAutorizar: (o.puedeAutorizar ?? datos.puedeAutorizar) === true,
            puedeVerCredito: (o.puedeVerCredito ?? datos.puedeVerCredito) === true,
            comparaTotal: o.comparaTotal !== false
        };
        posicion = null; total = 0; base = 0; pago = 0;
        solicitud++;
        pintar();
        alElegirSocio($('#CodigoSn').val());
    }

    /** Hook de la selección del cliente: consulta su posición de crédito (solo con permiso de estado de cuenta). */
    async function alElegirSocio(codigoSn) {
        const mia = ++solicitud;
        posicion = null;
        pintar();
        const codigo = String(codigoSn ?? '').trim();
        if (!cfg.puedeVerCredito || !codigo) return;
        try {
            const r = await $.getJSON(cfg.urlPosicion, { codigoSn: codigo });
            if (mia !== solicitud) return;   // el usuario ya eligió otro cliente
            if (r && r.resultado && r.dato) posicion = r.dato;
        } catch (e) { /* informativo: sin consulta no se muestra nada */ }
        pintar();
    }

    /** Total del documento y la parte ya comprometida por pedidos/entregas base (valorLineasBase); recalcula el aviso. */
    function avisarTotal(nuevoTotal, comprometidoPorBase) {
        total = Number(nuevoTotal) || 0;
        base = Number(comprometidoPorBase) || 0;
        pintar();
    }

    /** Pago inmediato de la factura (se descuenta del monto estimado); recalcula el aviso. */
    function avisarPago(nuevoPago) {
        pago = Number(nuevoPago) || 0;
        pintar();
    }

    /** Σ del total de las líneas copiadas de un pedido (4) o una entrega (5): ese valor ya estaba comprometido, no suma. */
    function valorLineasBase(lineas) {
        return r2((lineas || []).reduce((suma, l) => {
            const tipo = Number(l.BaseTipo ?? l.baseTipo);
            return suma + (tipo === 4 || tipo === 5 ? (Number(l.TotalLinea ?? l.totalLinea) || 0) : 0);
        }, 0));
    }

    /**
     * Si la respuesta es un rechazo por crédito (respuesta.credito) muestra el diálogo y devuelve true; si no, false
     * (el llamador sigue con su manejo normal). Si el usuario puede autorizar y confirma, llama a reintentar() (que reenvía
     * el mismo documento con la autorización y procesa su respuesta). contexto: { pagoInmediato } (facturas).
     */
    async function manejar409(respuesta, reintentar, contexto) {
        const c = respuesta && respuesta.credito;
        if (!c) return false;
        const puede = cfg.puedeAutorizar === true && typeof reintentar === 'function';
        const r = await Swal.fire(opcionesDialogo(respuesta, c, puede, contexto, cfg.tipo));
        if (puede && r.isConfirmed) await reintentar();
        return true;
    }

    /**
     * Envía un documento con el control de crédito. envio(autorizar) hace la petición con el MISMO cuerpo y
     * AutorizarExcesoCredito = autorizar; la primera vez es siempre false. Devuelve la respuesta final, o null si hubo
     * un rechazo por crédito que el diálogo ya informó y el usuario no autorizó (cerró, canceló o no tiene permiso).
     */
    async function enviar(envio, contexto) {
        let final = await envio(false);
        let reintentado = false;
        const manejado = await manejar409(final, async () => {
            reintentado = true;
            final = await envio(true);
        }, contexto);
        return manejado && !reintentado ? null : final;
    }

    return { inicializar, alElegirSocio, avisarTotal, avisarPago, valorLineasBase, manejar409, enviar };
})();
