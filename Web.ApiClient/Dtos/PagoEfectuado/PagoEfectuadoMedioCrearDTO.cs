namespace Web.ApiClient.Dtos.PagoEfectuado
{
    public class PagoEfectuadoMedioCrearDTO
    {
        public string? CodFormaPago { get; set; }
        public decimal Monto { get; set; }
        public string? Referencia { get; set; }
        public string? Banco { get; set; }
        public DateTime? FechaCheque { get; set; }
    }
}
