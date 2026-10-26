namespace Web.ApiClient.Dtos.NotaDebitoCompra
{
    public class NotaDebitoCompraDTO
    {
        public int Entry { get; set; }
        public int NumDoc { get; set; }
        public int Serie { get; set; }
        public string? Cancelado { get; set; }
        public string? NumManual { get; set; }
        public string? Imprimido { get; set; }
        public string? EstadoDoc { get; set; }
        public string? TipoObjeto { get; set; }
        public string? DocType { get; set; }
        public DateTime? FechaDoc { get; set; }
        public DateTime? FechaEmision { get; set; }
        public DateTime? FechaCancelado { get; set; }
        public string? CodigoSn { get; set; }
        public string? NombreSn { get; set; }
        public string? Direccion { get; set; }
        public string? MonedaDoc { get; set; }
        public int? BaseTipo { get; set; }
        public int? BaseEntry { get; set; }
        public decimal? PrctjeImpuesto { get; set; }
        public decimal? TotalImp { get; set; }
        public decimal? PrctjeDesc { get; set; }
        public decimal? TotalDesc { get; set; }
        public decimal? TotalBruto { get; set; }
        public decimal? TotalDoc { get; set; }
        public string? Comentario { get; set; }
        /// <summary>Código de la condición de pago con que se creó el documento.</summary>
        public string? CondicionPago { get; set; }
        /// <summary>Fecha de vencimiento (fecha del documento más los días de la condición de pago).</summary>
        public DateTime? FechaVencimiento { get; set; }
        /// <summary>Suma de pagos activos aplicados. La llena el controlador de la Web (no viene del API de compras).</summary>
        public decimal? Pagado { get; set; }
        /// <summary>Saldo por pagar (total − notas de crédito − pagos).</summary>
        public decimal? Saldo { get; set; }
        /// <summary>Pendiente, Parcial o Pagada.</summary>
        public string? EstadoPago { get; set; }
    }
}
