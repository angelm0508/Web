// Tipo del artículo: "Artículo" (ArticuloInventario = S, lleva existencias) o "Servicio / mano de obra" (N, no mueve
// inventario). Para un servicio se deshabilitan los datos de existencias, que no aplican. Sirve tanto a la página
// "Nuevo" como al modal de edición (por eso los listeners son delegados).
$(function () {
    const SELECTOR = '#ArticuloInventario';

    function aplicarTipo() {
        const $tipo = $(SELECTOR);
        if ($tipo.length === 0) return;

        const esServicio = $tipo.val() === 'N';
        $('#Minimo, #Maximo, #almacenDefectoTexto').prop('disabled', esServicio);
        if (esServicio) {
            $('#Minimo, #Maximo, #almacenDefectoTexto').val('');
            $('#AlmacenDefecto').val('');
        }
    }

    $(document).on('change', SELECTOR, aplicarTipo);
    $('#modalFormulario').on('shown.bs.modal.tipoArticulo', aplicarTipo);
    aplicarTipo();
});
