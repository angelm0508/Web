namespace Web.ApiClient.Dtos.Pos
{
    /// <summary>Cuerpo de <c>POST api/Pos/Venta</c>. Los precios no viajan: los calcula la API.</summary>
    public class VentaPosSolicitud
    {
        public string? CodigoCliente { get; set; }
        public string? Nit { get; set; }
        public List<VentaPosLinea> Lineas { get; set; } = new();
        public List<VentaPosPago> Pagos { get; set; } = new();
    }
}
