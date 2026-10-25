namespace Web.ApiClient.Dtos.PagoEfectuado
{
    public class DocumentoPorPagarDTO
    {
        public int Entry { get; set; }
        public int NumDoc { get; set; }
        /// <summary>"--" = factura de compra; "DN" = nota de débito de proveedor.</summary>
        public string? DocSubType { get; set; }
        public DateTime? FechaDoc { get; set; }
        public decimal Total { get; set; }
        public decimal Acreditado { get; set; }
        public decimal Pagado { get; set; }
        public decimal Saldo { get; set; }
        public string Estado { get; set; } = null!;
    }
}
