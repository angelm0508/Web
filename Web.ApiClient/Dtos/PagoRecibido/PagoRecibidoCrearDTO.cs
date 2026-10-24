namespace Web.ApiClient.Dtos.PagoRecibido
{
    public class PagoRecibidoCrearDTO
    {
        public int Serie { get; set; }
        public int NumDoc { get; set; }
        public DateTime? FechaDoc { get; set; }
        public string? CodigoSn { get; set; }
        public string? Comentario { get; set; }
        public List<PagoRecibidoFacturaCrearDTO> Facturas { get; set; } = new();
        public List<PagoRecibidoMedioCrearDTO> Medios { get; set; } = new();
    }
}
