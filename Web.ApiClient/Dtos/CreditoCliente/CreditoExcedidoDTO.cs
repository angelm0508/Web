namespace Web.ApiClient.Dtos.CreditoCliente
{
    /// <summary>Detalle de un documento rechazado por el control de crédito (cuerpo del 409).</summary>
    public class CreditoExcedidoDTO
    {
        /// <summary>LIMITE_CREDITO_EXCEDIDO o CLIENTE_CON_VENCIDO.</summary>
        public string Codigo { get; set; } = null!;
        public decimal? Limite { get; set; }
        public decimal Saldo { get; set; }
        public decimal Comprometido { get; set; }
        public decimal Vencido { get; set; }
        /// <summary>Monto nuevo que el documento suma a la exposición.</summary>
        public decimal Monto { get; set; }
        public decimal Exceso { get; set; }
        public decimal? Disponible { get; set; }
        /// <summary>
        /// Solo Web: true cuando las cifras se ocultaron porque el usuario no tiene EstadoCuenta / Ver; únicamente
        /// <see cref="Codigo"/> es válido. La API nunca lo envía.
        /// </summary>
        public bool Oculto { get; set; }
    }
}
