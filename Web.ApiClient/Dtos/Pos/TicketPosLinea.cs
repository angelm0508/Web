namespace Web.ApiClient.Dtos.Pos
{
    public class TicketPosLinea
    {
        public string CodArticulo { get; set; } = string.Empty;
        public string Descripcion { get; set; } = string.Empty;
        public decimal Cantidad { get; set; }
        public decimal PrecioNeto { get; set; }
        public decimal Total { get; set; }
    }
}
