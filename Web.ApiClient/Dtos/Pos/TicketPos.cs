namespace Web.ApiClient.Dtos.Pos
{
    /// <summary>Ticket de una venta POS (factura + cobro). Refleja <c>TicketPos</c>.</summary>
    public class TicketPos
    {
        public int FacturaEntry { get; set; }
        public int Serie { get; set; }
        public string NombreSerie { get; set; } = string.Empty;
        public int NumDoc { get; set; }
        public DateTime Fecha { get; set; }
        public string Cajero { get; set; } = string.Empty;
        public string CodigoCliente { get; set; } = string.Empty;
        public string NombreCliente { get; set; } = string.Empty;
        public string Nit { get; set; } = string.Empty;
        public List<TicketPosLinea> Lineas { get; set; } = new();
        public decimal Subtotal { get; set; }
        public decimal Impuesto { get; set; }
        public decimal Total { get; set; }
        public List<TicketPosPago> Pagos { get; set; } = new();
        public decimal Pagado { get; set; }
        public decimal Cambio { get; set; }
        public string Moneda { get; set; } = string.Empty;
        public string Empresa { get; set; } = string.Empty;
    }
}
