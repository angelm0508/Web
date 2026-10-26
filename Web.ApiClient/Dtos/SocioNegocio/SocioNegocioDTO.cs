namespace Web.ApiClient.Dtos.SocioNegocio
{
    public class SocioNegocioDTO
    {
        public string Codigo { get; set; } = null!;
        public string? Nombre { get; set; }
        public string? TipoSn { get; set; }
        public short? GrupoSn { get; set; }
        public string? Cui { get; set; }
        public string? Nit { get; set; }
        public string? PersContacto { get; set; }
        public string? Tel1 { get; set; }
        public string? Tel2 { get; set; }
        public decimal? Descuento { get; set; }
        public int? NumLstPrecio { get; set; }
        /// <summary>Condición de pago por defecto del socio (código); null = Contado.</summary>
        public string? CondicionPago { get; set; }
        public string? Email { get; set; }
        public string? Activo { get; set; }
        public int Serie { get; set; }
        /// <summary>Saldo abierto del socio; solo se llena en el listado cuando el usuario puede ver Estado de cuenta.</summary>
        public decimal? Saldo { get; set; }
        /// <summary>Parte vencida del saldo; mismo origen que Saldo.</summary>
        public decimal? Vencido { get; set; }
    }
}
