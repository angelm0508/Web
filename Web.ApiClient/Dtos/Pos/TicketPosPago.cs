namespace Web.ApiClient.Dtos.Pos
{
    public class TicketPosPago
    {
        public string CodFormaPago { get; set; } = string.Empty;
        public string Forma { get; set; } = string.Empty;
        public decimal Monto { get; set; }
    }
}
