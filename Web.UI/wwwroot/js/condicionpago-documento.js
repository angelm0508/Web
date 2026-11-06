// Condición de pago y vencimiento de facturas y notas de débito (de cliente y de proveedor).
// Lo comparten facturas.js, notasdebito.js, facturascompra.js y notasdebitocompra.js.
//
// En el formulario: la lista #CondicionPago (cada <option> trae sus días en data-dias) y el campo de solo
// lectura #FechaVencimiento. El vencimiento que se muestra al crear es solo informativo: el servidor lo
// vuelve a calcular (fecha del documento + días de la condición) y el cliente nunca lo envía.
// En el listado: la columna "Vence" con la insignia "Vencida".
const CondicionPagoDoc = (function () {
    const CONDICION_POR_DEFECTO = 'CON';

    const esc = v => $('<div>').text(v ?? '').html();

    /** 'yyyy-MM-dd' del inicio de un valor de fecha (ISO o de <input type="date">); null si no tiene esa forma. */
    function fechaIso(valor) {
        const m = /^(\d{4}-\d{2}-\d{2})/.exec(String(valor ?? ''));
        return m ? m[1] : null;
    }

    /** Suma días a una fecha 'yyyy-MM-dd' sin depender de la zona horaria; null si la fecha o los días no son válidos. */
    function sumarDias(iso, dias) {
        const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso ?? ''));
        if (!m || !Number.isInteger(dias) || dias < 0) return null;
        const y = Number(m[1]), mes = Number(m[2]) - 1, d = Number(m[3]);
        const base = new Date(Date.UTC(y, mes, d));
        if (base.getUTCFullYear() !== y || base.getUTCMonth() !== mes || base.getUTCDate() !== d) return null;   // 2026-02-30
        const resultado = new Date(base.getTime() + dias * 86400000);
        if (resultado.getUTCFullYear() > 9999) return null;
        return resultado.toISOString().slice(0, 10);
    }

    function hoyIso() {
        const h = new Date();
        return `${h.getFullYear()}-${String(h.getMonth() + 1).padStart(2, '0')}-${String(h.getDate()).padStart(2, '0')}`;
    }

    /** Recalcula el campo Vencimiento (solo para mostrarlo). En edición la lista está deshabilitada y se deja el valor del servidor. */
    function recalcular() {
        const $sel = $('#CondicionPago');
        const $venc = $('#FechaVencimiento');
        if ($sel.length === 0 || $venc.length === 0 || $sel.prop('disabled')) return;
        const dias = parseInt($sel.find('option:selected').attr('data-dias'), 10);
        $venc.val(sumarDias($('#FechaDoc').val(), dias) || '');
    }

    /** Selecciona la condición del socio (o Contado si no tiene). Si ya no está activa la agrega marcada para que el servidor la rechace con su mensaje. */
    function preseleccionar(codigo) {
        const $sel = $('#CondicionPago');
        if ($sel.length === 0 || $sel.prop('disabled') || $sel.find('option').length === 0) return;
        const c = String(codigo ?? '').trim() || CONDICION_POR_DEFECTO;
        if (!$sel.find('option').toArray().some(o => o.value === c)) {
            $sel.append($('<option>').val(c).attr('data-dias', '').text(`${c} (inactiva)`));
        }
        $sel.val(c);
        recalcular();
    }

    /** Llamar al abrir el formulario: calcula el vencimiento inicial de la condición preseleccionada. */
    function inicializar() {
        recalcular();
    }

    /** Render de la columna "Vence" del listado: fecha y, con saldo pendiente y fecha ya pasada, la insignia "Vencida". */
    function renderVence(d, t, row) {
        if (!row || row.cancelado === 'S' || row.estadoDoc === 'C') return '';
        const iso = fechaIso(d) || fechaIso(row.fechaDoc);   // documentos antiguos sin vencimiento: vence el día del documento
        if (!iso) return '';
        if (t !== 'display') return iso;
        const vencida = Number(row.saldo) > 0 && iso < hoyIso();   // por día: vencer hoy todavía no es estar vencida
        const texto = new Date(`${iso}T00:00:00`).toLocaleDateString();
        return esc(texto) + (vencida ? ' <span class="badge text-bg-danger">Vencida</span>' : '');
    }

    $(document).on('input change', '#FechaDoc, #CondicionPago', recalcular);

    return { inicializar, preseleccionar, renderVence };
})();
