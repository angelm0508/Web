namespace Web.ApiClient.Dtos.FormaPago
{
    public class FormaPagoCrearDTO
    {
        public string Codigo { get; set; } = null!;
        public string Nombre { get; set; } = null!;
        public string? TipoDato { get; set; } = "N";
        public string? Activo { get; set; } = "S";
    }
}
