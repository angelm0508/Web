namespace Web.ApiClient.Dtos.Impuesto
{
    public class ImpuestoDTO
    {
        public string Codigo { get; set; } = null!;
        public string Nombre { get; set; } = null!;
        public decimal? Tasa { get; set; }
    }
}
