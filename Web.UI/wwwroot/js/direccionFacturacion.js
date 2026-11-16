// Dirección de facturación del socio en los documentos de compra y venta.
// Al elegir un socio se pide su dirección FAC ya armada ("calle, bloque, municipio, departamento") y se
// escribe en el campo Dirección. Sin dirección de facturación el campo queda vacío.
// No se toca un campo de solo lectura (edición o documento con base: ya hereda su dirección), y una respuesta
// tardía se descarta si el usuario cambió de socio o el valor del campo cambió mientras tanto.
App.direccionFacturacion = (function () {
    let ultimaPeticion = 0;

    function aplicar(codigoSn, $campo) {
        const idPeticion = ++ultimaPeticion;
        if (!$campo || $campo.length === 0 || $campo.prop('readonly') || $campo.prop('disabled')) return;

        if (!codigoSn) {
            $campo.val('');
            return;
        }

        const valorAntes = $campo.val();
        $.get('/Direcciones/FacturacionDeSocio', { codigoSn })
            .done(function (respuesta) {
                if (idPeticion !== ultimaPeticion) return;          // ya eligió otro socio
                if ($campo.val() !== valorAntes) return;            // otro código o el usuario ya escribió la dirección
                $campo.val(respuesta && respuesta.resultado && respuesta.dato ? respuesta.dato : '');
            });
        // Si falla la consulta (p. ej. sin permiso para ver socios) no se interrumpe al usuario: el campo se deja como está.
    }

    return { aplicar };
})();
