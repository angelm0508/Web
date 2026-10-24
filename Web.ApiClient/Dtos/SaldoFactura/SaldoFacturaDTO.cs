namespace Web.ApiClient.Dtos.SaldoFactura
{
    public class SaldoFacturaDTO
    {
        public int FacturaEntry { get; set; }
        public decimal Total { get; set; }
        public decimal Acreditado { get; set; }
        public decimal Pagado { get; set; }
        public decimal Saldo { get; set; }
        /// <summary>Pendiente, Parcial o Pagada.</summary>
        public string Estado { get; set; } = null!;
    }
}
