namespace Web.ApiClient.Dtos.Pos
{
    /// <summary>Configuración del POS (una sola fila en la API). Refleja <c>PosConfiguracionDato</c>.</summary>
    public class PosConfiguracionDato
    {
        public int? SerieFactura { get; set; }
        public int? SeriePago { get; set; }
        public string? CodAlmacen { get; set; }
        public string? CodigoImpuesto { get; set; }
        public string? ClienteDefecto { get; set; }
        public string? FormaPagoEfectivo { get; set; }
        public string? MonedaDoc { get; set; }
    }
}
