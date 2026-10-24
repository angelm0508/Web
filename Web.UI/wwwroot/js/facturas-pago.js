// Pago al facturar: sección "Registrar el pago ahora" del formulario de Nueva factura.
// Autocontenida: facturas.js la inicializa al abrir el modal (FacturasPago.inicializar), le avisa del total
// (FacturasPago.actualizarTotal) y, al guardar, la valida (validar), pregunta si está activa (activo) y registra el pago
// sobre la factura recién creada (registrar). Los listeners son delegados porque el modal se vuelve a pintar cada vez.
window.FacturasPago = (function () {
    const r2 = n => Math.round((Number(n) + Number.EPSILON) * 100) / 100;
    const dinero = n => r2(n).toFixed(2);
    const escapar = v => $('<div>').text(v ?? '').html().replace(/"/g, '&quot;');

    let datos = null;       // { formas: [{codigo, nombre, tipoDato}], serie }
    let total = 0;          // total de la factura (lo informa facturas.js al repintar el detalle)
    let medioAuto = true;   // mientras haya una sola forma y no se edite, su monto sigue al total de la factura

    function hayContexto() { return $('#seccionPagoFactura').length > 0; }

    function motivoNoDisponible() {
        if (!datos) return 'No se pudo cargar la información de pagos.';
        if (!datos.formas || datos.formas.length === 0)
            return 'No hay formas de pago activas. Cree una en "Formas de pago" o revise el permiso Ver de Formas de pago.';
        if (datos.serie == null)
            return 'No hay una serie automática disponible para pagos recibidos. Revise la numeración del objeto Pago recibido y el permiso Ver de Numeración de documentos.';
        if (!(r2(total) > 0)) return 'La factura aún no tiene importe a pagar.';
        return null;
    }

    function activo() {
        return hayContexto() && $('#chkPagoAhora').is(':checked') && !$('#chkPagoAhora').prop('disabled');
    }

    // ---- filas de formas de pago ----
    function opcionesFormas() {
        return datos.formas.map(f => `<option value="${escapar(f.codigo)}" data-tipo="${escapar(f.tipoDato)}">${escapar(f.nombre)}</option>`).join('');
    }

    function ajustarCamposMedio($fila) {
        const tipo = $fila.find('.sel-forma option:selected').data('tipo');
        const usaReferencia = tipo === 'C' || tipo === 'T' || tipo === 'J';
        const usaBanco = tipo === 'C' || tipo === 'T';
        const usaFecha = tipo === 'C';
        const marcas = { C: 'Nº de cheque', T: 'Referencia', J: 'Autorización / últimos 4' };
        $fila.find('.inp-ref').prop('disabled', !usaReferencia).attr('placeholder', marcas[tipo] || '');
        $fila.find('.inp-banco').prop('disabled', !usaBanco).attr('placeholder', tipo === 'C' ? 'Banco' : (tipo === 'T' ? 'Banco (opcional)' : ''));
        $fila.find('.inp-fecha-cheque').prop('disabled', !usaFecha);
        if (!usaReferencia) $fila.find('.inp-ref').val('');
        if (!usaBanco) $fila.find('.inp-banco').val('');
        if (!usaFecha) $fila.find('.inp-fecha-cheque').val('');
    }

    function agregarMedio() {
        if (!datos || !datos.formas || datos.formas.length === 0) return;
        if ($('#tblMediosFactura tbody tr').length >= 1) medioAuto = false;
        const $fila = $(`
            <tr>
                <td><select class="form-select form-select-sm sel-forma">${opcionesFormas()}</select></td>
                <td style="width:9rem"><input type="number" class="form-control form-control-sm text-end inp-medio-monto" min="0" step="0.01"></td>
                <td><input type="text" class="form-control form-control-sm inp-ref" maxlength="50"></td>
                <td><input type="text" class="form-control form-control-sm inp-banco" maxlength="60"></td>
                <td style="width:10rem"><input type="date" class="form-control form-control-sm inp-fecha-cheque"></td>
                <td class="text-end"><button type="button" class="btn btn-sm btn-outline-danger btn-quitar-medio-factura" title="Quitar"><i class="fa-solid fa-trash"></i></button></td>
            </tr>`);
        $('#tblMediosFactura tbody').append($fila);
        ajustarCamposMedio($fila);
        recalcular();
    }

    function mediosLeidos() {
        const lista = [];
        $('#tblMediosFactura tbody tr').each(function () {
            const $fila = $(this);
            const monto = parseFloat($fila.find('.inp-medio-monto').val());
            if (!(monto > 0)) return;
            lista.push({
                CodFormaPago: $fila.find('.sel-forma').val(),
                Monto: r2(monto),
                Referencia: ($fila.find('.inp-ref').val() || '').trim() || null,
                Banco: ($fila.find('.inp-banco').val() || '').trim() || null,
                FechaCheque: $fila.find('.inp-fecha-cheque').val() || null,
                _tipo: $fila.find('.sel-forma option:selected').data('tipo'),
                _nombre: $fila.find('.sel-forma option:selected').text()
            });
        });
        return lista;
    }

    function totalMedios() {
        let suma = 0;
        $('#tblMediosFactura .inp-medio-monto').each(function () { suma += Math.max(0, r2(parseFloat($(this).val()) || 0)); });
        return r2(suma);
    }

    function recalcular() {
        if (!hayContexto()) return;
        const $filas = $('#tblMediosFactura tbody tr');
        if (medioAuto && $filas.length === 1) {
            $filas.find('.inp-medio-monto').val(r2(total) > 0 ? r2(total) : '');
        }
        const pagado = totalMedios();
        const pendiente = r2(total - pagado);
        $('#pagoTotalFactura').text(dinero(total));
        $('#pagoPagado').text(dinero(pagado));
        $('#pagoPendiente').text(dinero(pendiente))
            .toggleClass('text-danger', pendiente < 0)
            .toggleClass('text-success', pendiente === 0 && pagado > 0);
    }

    function refrescarDisponibilidad() {
        if (!hayContexto()) return;
        const motivo = motivoNoDisponible();
        const $chk = $('#chkPagoAhora');
        $chk.prop('disabled', motivo !== null);
        if (motivo !== null && $chk.is(':checked')) {
            $chk.prop('checked', false);
            $('#panelPagoFactura').addClass('d-none');
        }
        $('#notaPagoFactura').toggleClass('d-none', motivo === null || motivo === 'La factura aún no tiene importe a pagar.').text(motivo || '');
    }

    function inicializar() {
        medioAuto = true;
        total = 0;
        datos = null;
        if (!hayContexto()) return;
        const el = document.getElementById('datosPagoFactura');
        try { datos = el ? JSON.parse(el.textContent) : null; } catch (e) { datos = null; }
        refrescarDisponibilidad();
        recalcular();
    }

    function actualizarTotal(nuevoTotal) {
        total = Number(nuevoTotal) || 0;
        if (!hayContexto()) return;
        refrescarDisponibilidad();
        recalcular();
    }

    // Devuelve null si no hay nada que validar (sección apagada) o el texto del primer error.
    function validar() {
        if (!activo()) return null;
        const medios = mediosLeidos();
        if (medios.length === 0) return 'Indica al menos una forma de pago con monto mayor que 0.';
        for (const m of medios) {
            if (m._tipo === 'C') {
                if (!m.Referencia) return `La forma de pago ${m._nombre} requiere el número de cheque.`;
                if (!m.Banco) return `La forma de pago ${m._nombre} requiere el banco.`;
            } else if (m._tipo === 'T') {
                if (!m.Referencia) return `La forma de pago ${m._nombre} requiere la referencia de la transferencia.`;
            } else if (m._tipo === 'J') {
                if (!m.Referencia) return `La forma de pago ${m._nombre} requiere la autorización o los últimos 4 dígitos de la tarjeta.`;
            }
        }
        const pagado = totalMedios();
        if (!(pagado > 0)) return 'El monto del pago debe ser mayor que 0.';
        if (pagado > r2(total)) return `El pago (${dinero(pagado)}) no puede ser mayor que el total de la factura (${dinero(total)}).`;
        return null;
    }

    // Registra el pago sobre la factura recién creada; devuelve la Respuesta<int> de /PagosRecibidos/Crear.
    async function registrar(facturaEntry, datosFactura) {
        const medios = mediosLeidos().map(({ _tipo, _nombre, ...m }) => m);
        const pagado = r2(medios.reduce((s, m) => s + m.Monto, 0));
        const hoy = new Date().toISOString().slice(0, 10);
        const pago = {
            Serie: datos.serie,
            NumDoc: 0,
            FechaDoc: (datosFactura && datosFactura.FechaDoc) || hoy,
            CodigoSn: datosFactura ? datosFactura.CodigoSn : null,
            Comentario: null,
            Facturas: [{ FacturaEntry: facturaEntry, MontoAplicado: pagado }],
            Medios: medios
        };
        return await App.enviarJson('/PagosRecibidos/Crear', 'POST', pago);
    }

    // ---- eventos (delegados: el modal se repinta en cada apertura) ----
    $(document).on('change', '#chkPagoAhora', function () {
        const encendido = this.checked;
        $('#panelPagoFactura').toggleClass('d-none', !encendido);
        if (encendido && $('#tblMediosFactura tbody tr').length === 0) {
            medioAuto = true;
            agregarMedio();
        }
        recalcular();
    });

    $(document).on('click', '#btnAgregarMedioFactura', agregarMedio);

    $(document).on('change', '#tblMediosFactura .sel-forma', function () {
        ajustarCamposMedio($(this).closest('tr'));
    });

    $(document).on('input', '#tblMediosFactura .inp-medio-monto', function () {
        medioAuto = false;
        recalcular();
    });

    $(document).on('click', '#tblMediosFactura .btn-quitar-medio-factura', function () {
        $(this).closest('tr').remove();
        recalcular();
    });

    return { inicializar, actualizarTotal, validar, activo, registrar };
})();
