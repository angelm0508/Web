$(function () {
    const datos = JSON.parse(document.getElementById('datosEstadoCuenta').textContent);

    // Escapa texto de usuario para interpolarlo en HTML.
    const escapar = v => $('<div>').text(v ?? '').html().replace(/"/g, '&quot;');
    const dinero = n => Number(n ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    // Fecha ISO (yyyy-MM-dd[Thh:mm:ss]) a dd/MM/yyyy sin pasar por Date (evita desfases de zona horaria).
    const fecha = v => {
        const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(v || '');
        return m ? `${m[3]}/${m[2]}/${m[1]}` : '';
    };

    const $codigo = $('#CodigoSn');
    const $desde = $('#Desde');
    const $hasta = $('#Hasta');
    let consultaId = 0; // descarta respuestas de una consulta anterior si el socio o el rango cambió

    $desde.val(datos.desde);
    $hasta.val(datos.hasta);

    // Si viene un socio por URL se muestra su nombre; sin nombre (socio inexistente) queda solo el código y la API informa el error.
    if (datos.codigoSn) {
        $('#CodigoSnTexto').val(datos.nombreSn ? `${datos.codigoSn} - ${datos.nombreSn}` : datos.codigoSn);
        $codigo.val(datos.codigoSn);
    }

    App.autocompletar({
        texto: $('#CodigoSnTexto'),
        oculto: $codigo,
        lista: $('#CodigoSnResultados'),
        error: $('#CodigoSnError'),
        endpoint: '/EstadoCuenta/BuscarSocios',
        obtenerCodigo: s => s.codigo ?? s.Codigo,
        obtenerEtiqueta: s => `${s.codigo ?? s.Codigo} - ${s.nombre ?? s.Nombre}`,
        onSeleccion: s => { if (s) consultar(); else limpiarResultado(); }
    });

    function limpiarResultado() {
        consultaId++;
        $('#resultado').addClass('d-none');
        $('#errorEstado').addClass('d-none').text('');
        mostrarErrorFiltro('');
    }

    function mostrarErrorFiltro(mensaje) {
        $('#errorFiltro').text(mensaje).toggleClass('d-none', !mensaje);
    }

    function validar() {
        if (!$codigo.val()) {
            mostrarErrorFiltro('Selecciona un socio de negocio.');
            return false;
        }
        if ($desde.val() && $hasta.val() && $desde.val() > $hasta.val()) {
            mostrarErrorFiltro('La fecha inicial no puede ser posterior a la final.');
            return false;
        }
        mostrarErrorFiltro('');
        return true;
    }

    async function consultar() {
        if (!validar()) return;
        const id = ++consultaId;
        const $boton = $('#btnConsultar').prop('disabled', true);
        $('#errorEstado').addClass('d-none').text('');
        let respuesta;
        try {
            respuesta = await $.get('/EstadoCuenta/ObtenerEstadoCuenta', {
                codigoSn: $codigo.val(),
                desde: $desde.val() || undefined,
                hasta: $hasta.val() || undefined
            });
        } catch (e) {
            respuesta = { resultado: false, mensaje: 'No se pudo cargar el estado de cuenta.' };
        }
        if (id !== consultaId) return;
        $boton.prop('disabled', false);

        if (!respuesta || !respuesta.resultado || !respuesta.dato) {
            $('#resultado').addClass('d-none');
            $('#errorEstado').text((respuesta && respuesta.mensaje) || 'No se pudo cargar el estado de cuenta.').removeClass('d-none');
            return;
        }
        pintar(respuesta.dato);
    }

    function pintar(e) {
        const tipoSocio = e.tipoSn === 'C' ? 'Cliente' : (e.tipoSn === 'P' ? 'Proveedor' : '');
        $('#tituloSocio').text(`${e.codigoSn} - ${e.nombreSn || ''}`);
        $('#subtituloSocio').text([tipoSocio, `Del ${fecha(e.desde)} al ${fecha(e.hasta)}`].filter(Boolean).join(' · '));
        $('#resumenSaldoActual').text(dinero(e.saldoActual));
        $('#resumenVencido')
            .text(dinero(e.vencido))
            .toggleClass('text-danger', Number(e.vencido) > 0);

        const filas = [];
        filas.push(`<tr class="fw-semibold" style="background-color: rgba(128, 128, 128, .12);">
            <td>${escapar(fecha(e.desde))}</td><td colspan="4">Saldo inicial</td>
            <td class="text-end">${dinero(e.saldoInicial)}</td></tr>`);

        (e.movimientos || []).forEach(m => {
            const documento = `${escapar(m.tipo)} ${escapar(m.numDoc)}`;
            if (m.informativo) {
                filas.push(`<tr class="text-muted fst-italic" style="opacity:.65">
                    <td>${escapar(fecha(m.fecha))}</td>
                    <td>${documento}</td>
                    <td>${escapar(m.descripcion)} <span class="badge text-bg-secondary">sin aplicar</span></td>
                    <td></td><td></td><td></td></tr>`);
                return;
            }
            filas.push(`<tr>
                <td>${escapar(fecha(m.fecha))}</td>
                <td>${documento}</td>
                <td>${escapar(m.descripcion)}</td>
                <td class="text-end">${Number(m.cargo) ? dinero(m.cargo) : ''}</td>
                <td class="text-end">${Number(m.abono) ? dinero(m.abono) : ''}</td>
                <td class="text-end">${dinero(m.saldoAcumulado)}</td></tr>`);
        });

        filas.push(`<tr class="fw-semibold" style="background-color: rgba(128, 128, 128, .12);">
            <td>${escapar(fecha(e.hasta))}</td><td colspan="4">Saldo final</td>
            <td class="text-end">${dinero(e.saldoFinal)}</td></tr>`);

        $('#tblEstadoCuenta tbody').html(filas.join(''));
        $('#resultado').removeClass('d-none');
    }

    $('#btnConsultar').on('click', consultar);
    $desde.add($hasta).on('change', function () {
        if (validar() && $('#resultado').is(':visible')) consultar();
    });

    // Con socio por URL (p. ej. desde la ficha del socio) se consulta de inmediato.
    if (datos.codigoSn) consultar();
});
