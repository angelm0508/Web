namespace Web.ApiClient.Dtos.UnidadMedidaArticulo
{
    public class UnidadMedidaArticuloDTO
    {
        public int Entry { get; set; }
        public string Codigo { get; set; } = string.Empty;
        public string? Nombre { get; set; }
        public decimal? Largo { get; set; }
        public decimal? Ancho { get; set; }
        public decimal? Altura { get; set; }
        public decimal? Volumen { get; set; }
        public decimal? Peso { get; set; }
        public string? Bloqueado { get; set; }
    }
}
