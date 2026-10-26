namespace Web.ApiClient.Dtos.CondicionPago
{
    public class CondicionPagoCrearDTO
    {
        public string Codigo { get; set; } = null!;
        public string Nombre { get; set; } = null!;
        public int? Dias { get; set; }
        public string? Activo { get; set; } = "S";
    }
}
