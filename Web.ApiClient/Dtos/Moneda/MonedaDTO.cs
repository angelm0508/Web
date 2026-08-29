namespace Web.ApiClient.Dtos.Moneda
{
    public class MonedaDTO
    {
        public string Codigo { get; set; } = null!;
        public string? Nombre { get; set; }
        public string? NombreImpresion { get; set; }
        public string? Centena { get; set; }
        public string? CodigoIso { get; set; }
        public short? TipoReondeo { get; set; }
    }
}
