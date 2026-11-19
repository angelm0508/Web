namespace Web.ApiClient.Dtos.Pos
{
    public class VentaPosDelDia
    {
        public int FacturaEntry { get; set; }
        public int Serie { get; set; }
        public int NumDoc { get; set; }
        public DateTime Fecha { get; set; }
        public string CodigoCliente { get; set; } = string.Empty;
        public string NombreCliente { get; set; } = string.Empty;
        public decimal Total { get; set; }
        public bool Cancelada { get; set; }
    }
}
