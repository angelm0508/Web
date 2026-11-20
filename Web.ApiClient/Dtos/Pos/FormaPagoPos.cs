namespace Web.ApiClient.Dtos.Pos
{
    /// <summary>Forma de pago activa para la pantalla del POS. Refleja <c>FormaPagoPos</c> de la API.</summary>
    public class FormaPagoPos
    {
        public string Codigo { get; set; } = string.Empty;
        public string Nombre { get; set; } = string.Empty;
        public string TipoDato { get; set; } = "N";
    }
}
