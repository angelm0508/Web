namespace Web.ApiClient.Dtos.CondicionPago
{
    public class CondicionPagoActualizarDTO
    {
        public string Nombre { get; set; } = null!;
        public int? Dias { get; set; }
        public string? Activo { get; set; }
    }
}
