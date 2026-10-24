$(function () {
    const datos = JSON.parse(document.getElementById('datosPagoCrear').textContent);
    const formas = datos.formas || [];
    let facturaInicial = datos.facturaEntry ?? null;

    const r2 = n => Math.round((Number(n) + Number.EPSILON) * 100) / 100;
    const dinero = n => r2(n).toFixed(2);
    const escapar = v => $('<div>').text(v ?? '').html().replace(/"/g, '&quot;');
    const etiqueta = d => (d.docSubType === 'ND' ? 'Nota de débito ' : 'Factura ') + d.numDoc;

    let documentos = [];        // documentos con saldo del cliente elegido
    const aplicado = new Map(); // facturaEntry -> monto a pagar
    let medioAuto = true;       // mientras haya una sola forma y no se edite, su monto sigue al total aplicado
    let cargaId = 0;            // descarta respuestas de una carga anterior si el cliente cambió

    // ---- serie ----
    function actualizarNumeroManual() {
        const manual = $('#Serie option:selected').data('manual') === 'S';
        $('#grupoNumDoc').toggleClass('d-none', !manual);
        if (!manual) $('#NumDoc').val('');
    }
    $('#Serie').on('change', actualizarNumeroManual);
    actualizarNumeroManual();

    // ---- cliente ----
    const buscadorCliente = App.autocompletar({
        texto: $('#CodigoSnTexto'),
        oculto: $('#CodigoSn'),
        lista: $('#CodigoSnResultados'),
        error: $('#CodigoSnError'),
        endpoint: '/PagosRecibidos/BuscarSocios',
        obtenerCodigo: s => s.codigo ?? s.Codigo,
        obtenerEtiqueta: s => `${s.codigo ?? s.Codigo} - ${s.nombre ?? s.Nombre}`,
        onSeleccion: s => cargarDocumentos(s ? (s.codigo ?? s.Codigo) : null)
    });

    async function cargarDocumentos(codigoSn) {
        const id = ++cargaId;
        documentos = [];
        aplicado.clear();
        if (!codigoSn) {
            pintarDocumentos();
            recalcular();
            return;
        }
        let respuesta;
        try {
            respuesta = await $.get('/PagosRecibidos/DocumentosPorCobrar', { codigoSn });
        } catch (e) {
            respuesta = { resultado: false, mensaje: 'No se pudieron cargar los documentos del cliente.' };
        }
        if (id !== cargaId) return;
        if (!respuesta.resultado) {
            App.mostrarError(respuesta.mensaje);
        } else {
            documentos = respuesta.dato || [];
            if (facturaInicial != null) {
                const d = documentos.find(x => x.entry === facturaInicial);
                if (d) aplicado.set(d.entry, r2(d.saldo));
            }
        }
        facturaInicial = null;
        pintarDocumentos();
        recalcular();
    }

    // ---- documentos por cobrar ----
    function pintarDocumentos() {
        const $tbody = $('#tblDocumentos tbody').empty();
        const hayCliente = !!$('#CodigoSn').val();
        if (documentos.length === 0) {
            $('#tblDocumentos').addClass('d-none');
            $('#sinDocumentos').removeClass('d-none')
                .text(hayCliente ? 'El cliente no tiene facturas ni notas de débito con saldo.' : 'Elige un cliente para ver sus documentos con saldo.');
            return;
        }
        $('#sinDocumentos').addClass('d-none');
        $('#tblDocumentos').removeClass('d-none');
        documentos.forEach(d => {
            const monto = aplicado.get(d.entry);
            const marcado = monto != null;
            $tbody.append(`
                <tr data-entry="${d.entry}">
                    <td class="text-center"><input type="checkbox" class="form-check-input chk-pagar"${marcado ? ' checked' : ''}></td>
                    <td>${escapar(etiqueta(d))}</td>
                    <td>${d.fechaDoc ? new Date(d.fechaDoc).toLocaleDateString() : ''}</td>
                    <td class="text-end">${dinero(d.total)}</td>
                    <td class="text-end">${dinero(d.acreditado)}</td>
                    <td class="text-end">${dinero(d.pagado)}</td>
                    <td class="text-end fw-semibold">${dinero(d.saldo)}</td>
                    <td style="width:9rem"><input type="number" class="form-control form-control-sm text-end inp-monto" min="0" max="${r2(d.saldo)}" step="0.01" value="${marcado ? r2(monto) : ''}"${marcado ? '' : ' disabled'}></td>
                </tr>`);
        });
    }

    function documentoDeFila($fila) {
        const entry = Number($fila.data('entry'));
        return documentos.find(x => x.entry === entry);
    }

    $('#tblDocumentos').on('change', '.chk-pagar', function () {
        const $fila = $(this).closest('tr');
        const d = documentoDeFila($fila);
        const $monto = $fila.find('.inp-monto');
        if (this.checked) {
            aplicado.set(d.entry, r2(d.saldo));
            $monto.prop('disabled', false).val(r2(d.saldo));
        } else {
            aplicado.delete(d.entry);
            $monto.prop('disabled', true).val('');
        }
        recalcular();
    });

    $('#tblDocumentos').on('input', '.inp-monto', function () {
        const d = documentoDeFila($(this).closest('tr'));
        let valor = parseFloat($(this).val());
        if (isNaN(valor) || valor < 0) valor = 0;
        if (valor > d.saldo) {           // nunca más que el saldo del documento
            valor = d.saldo;
            $(this).val(r2(valor));
        }
        aplicado.set(d.entry, r2(valor));
        recalcular();
    });

    $('#btnPagarTodo').on('click', function () {
        documentos.forEach(d => aplicado.set(d.entry, r2(d.saldo)));
        pintarDocumentos();
        recalcular();
    });

    // ---- formas de pago ----
    function opcionesFormas() {
        return formas.map(f => `<option value="${escapar(f.codigo)}" data-tipo="${escapar(f.tipoDato)}">${escapar(f.nombre)}</option>`).join('');
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
        if (formas.length === 0) {
            App.mostrarError('No hay formas de pago activas. Crea una en "Formas de pago".');
            return;
        }
        if ($('#tblMedios tbody tr').length >= 1) medioAuto = false;
        const $fila = $(`
            <tr>
                <td><select class="form-select form-select-sm sel-forma">${opcionesFormas()}</select></td>
                <td style="width:9rem"><input type="number" class="form-control form-control-sm text-end inp-medio-monto" min="0" step="0.01"></td>
                <td><input type="text" class="form-control form-control-sm inp-ref" maxlength="50"></td>
                <td><input type="text" class="form-control form-control-sm inp-banco" maxlength="60"></td>
                <td style="width:10rem"><input type="date" class="form-control form-control-sm inp-fecha-cheque"></td>
                <td class="text-end"><button type="button" class="btn btn-sm btn-outline-danger btn-quitar-medio" title="Quitar"><i class="fa-solid fa-trash"></i></button></td>
            </tr>`);
        $('#tblMedios tbody').append($fila);
        ajustarCamposMedio($fila);
        recalcular();
    }

    $('#btnAgregarMedio').on('click', agregarMedio);

    $('#tblMedios').on('change', '.sel-forma', function () {
        ajustarCamposMedio($(this).closest('tr'));
    });

    $('#tblMedios').on('input', '.inp-medio-monto', function () {
        medioAuto = false;
        recalcular();
    });

    $('#tblMedios').on('click', '.btn-quitar-medio', function () {
        $(this).closest('tr').remove();
        recalcular();
    });

    // ---- totales y cuadre ----
    function totalAplicado() {
        let total = 0;
        aplicado.forEach(v => { total += v; });
        return r2(total);
    }

    function totalMedios() {
        let total = 0;
        $('#tblMedios .inp-medio-monto').each(function () { total += parseFloat($(this).val()) || 0; });
        return r2(total);
    }

    function recalcular() {
        const aplicadoTotal = totalAplicado();
        const $filas = $('#tblMedios tbody tr');
        if (medioAuto && $filas.length === 1) {
            $filas.find('.inp-medio-monto').val(aplicadoTotal > 0 ? aplicadoTotal : '');
        }
        const mediosTotal = totalMedios();
        const diferencia = r2(aplicadoTotal - mediosTotal);
        $('#totalAplicado').text(dinero(aplicadoTotal));
        $('#totalMedios').text(dinero(mediosTotal));
        $('#diferencia').text(dinero(diferencia))
            .toggleClass('text-success', diferencia === 0 && aplicadoTotal > 0)
            .toggleClass('text-danger', diferencia !== 0);
        $('#btnGuardarPago').prop('disabled', !(aplicadoTotal > 0 && diferencia === 0 && $('#CodigoSn').val()));
    }

    // ---- guardar ----
    $('#btnGuardarPago').on('click', async function () {
        const $boton = $(this);
        const manual = $('#Serie option:selected').data('manual') === 'S';

        const facturas = [...aplicado.entries()]
            .filter(([, monto]) => monto > 0)
            .map(([entry, monto]) => ({ FacturaEntry: entry, MontoAplicado: monto }));

        const medios = [];
        $('#tblMedios tbody tr').each(function () {
            const $fila = $(this);
            const monto = parseFloat($fila.find('.inp-medio-monto').val());
            if (!(monto > 0)) return;
            medios.push({
                CodFormaPago: $fila.find('.sel-forma').val(),
                Monto: r2(monto),
                Referencia: ($fila.find('.inp-ref').val() || '').trim() || null,
                Banco: ($fila.find('.inp-banco').val() || '').trim() || null,
                FechaCheque: $fila.find('.inp-fecha-cheque').val() || null
            });
        });

        const pago = {
            Serie: Number($('#Serie').val()),
            NumDoc: manual ? Number($('#NumDoc').val() || 0) : 0,
            FechaDoc: $('#FechaDoc').val() || null,
            CodigoSn: $('#CodigoSn').val(),
            Comentario: ($('#Comentario').val() || '').trim() || null,
            Facturas: facturas,
            Medios: medios
        };

        $boton.prop('disabled', true);
        try {
            const respuesta = await App.enviarJson('/PagosRecibidos/Crear', 'POST', pago);
            if (!respuesta.resultado) {
                App.mostrarError(respuesta.mensaje);
                return;
            }
            await App.mostrarExito('Pago registrado correctamente.');
            window.location.href = '/PagosRecibidos';
        } finally {
            recalcular();
        }
    });

    // ---- arranque ----
    agregarMedio();
    if (datos.codigoSn) {
        buscadorCliente.establecer({ codigo: datos.codigoSn, nombre: datos.nombreSn || datos.codigoSn });
    } else {
        pintarDocumentos();
    }
    recalcular();
});
