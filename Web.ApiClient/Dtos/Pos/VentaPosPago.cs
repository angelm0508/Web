namespace Web.ApiClient.Dtos.Pos
{
    public class VentaPosPago
    {
        public string CodFormaPago { get; set; } = string.Empty;
        public decimal Monto { get; set; }
        public string? Referencia { get; set; }
        public string? Banco { get; set; }
        public DateTime? FechaCheque { get; set; }
    }
}
