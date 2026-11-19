$(function () {
    const $texto = $('#ClienteDefectoTexto');

    function escaparHtml(texto) {
        return String(texto).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    }

    // Buscador de clientes (solo si el campo se puede editar).
    if ($texto.length > 0 && !$texto.prop('readonly')) {
        App.autocompletar({
            texto: $texto,
            oculto: $('#ClienteDefecto'),
            lista: $('#ClienteDefectoResultados'),
            error: $('#ClienteDefectoError'),
            endpoint: '/PosConfiguracion/BuscarClientes',
            obtenerCodigo: s => s.codigo ?? s.Codigo,
            obtenerEtiqueta: s => `${s.codigo ?? s.Codigo} - ${s.nombre ?? s.Nombre}`,
            minCaracteres: 0 // al enfocar el campo vacío se sugieren clientes sin tener que escribir
        });
    }

    // Aviso de faltantes: se vuelve a pintar con lo que devuelve la API al guardar.
    function mostrarFaltantes(faltantes) {
        const $aviso = $('#posFaltantes');
        if (faltantes && faltantes.length > 0) {
            $aviso.removeClass('alert-success').addClass('alert-warning').html(
                '<div class="fw-semibold mb-1">El POS todavía no puede vender. Falta completar:</div>' +
                '<ul class="mb-0">' + faltantes.map(f => `<li>${escaparHtml(f)}</li>`).join('') + '</ul>');
        } else {
            $aviso.removeClass('alert-warning').addClass('alert-success').text('La configuración del POS está completa.');
        }
    }

    function textoONulo(selector) {
        const valor = $(selector).val();
        return valor === null || valor === '' ? null : valor;
    }

    function enteroONulo(selector) {
        const valor = textoONulo(selector);
        return valor === null ? null : parseInt(valor, 10);
    }

    $('#btnGuardarPosConfiguracion').on('click', async function () {
        // Texto escrito en el buscador de cliente sin elegir una opción: no se guarda en silencio como «sin cliente».
        if ($texto.val() !== '' && !$('#ClienteDefecto').val()) {
            $texto.addClass('is-invalid');
            $('#ClienteDefectoError').removeClass('d-none');
            App.mostrarError('Elige el cliente por defecto de la lista o borra el texto.');
            return;
        }

        const datos = {
            serieFactura: enteroONulo('#SerieFactura'),
            seriePago: enteroONulo('#SeriePago'),
            codAlmacen: textoONulo('#CodAlmacen'),
            codigoImpuesto: textoONulo('#CodigoImpuesto'),
            clienteDefecto: textoONulo('#ClienteDefecto'),
            formaPagoEfectivo: textoONulo('#FormaPagoEfectivo'),
            monedaDoc: textoONulo('#MonedaDoc')
        };

        const $boton = $(this).prop('disabled', true);
        try {
            const respuesta = await App.enviarJson('/PosConfiguracion/Guardar', 'POST', datos);
            if (!respuesta.resultado) {
                App.mostrarError(respuesta.mensaje);
                return;
            }
            mostrarFaltantes(respuesta.dato ? respuesta.dato.faltantes : []);
            App.mostrarExito('Configuración del POS guardada correctamente.');
        } finally {
            $boton.prop('disabled', false);
        }
    });
});
