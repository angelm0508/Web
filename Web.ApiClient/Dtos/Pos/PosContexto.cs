namespace Web.ApiClient.Dtos.Pos
{
    /// <summary>
    /// Datos de carga de la pantalla del POS (todo bajo <c>Pos.Ver</c>): configuración y faltantes, formas de pago activas,
    /// tasa del impuesto configurado y nombre/NIT del cliente por defecto. Refleja <c>PosContexto</c> de la API.
    /// </summary>
    public class PosContexto
    {
        public PosConfiguracionVista Configuracion { get; set; } = new();
        public List<FormaPagoPos> FormasPago { get; set; } = new();
        public decimal TasaImpuesto { get; set; }
        public string? NombreCliente { get; set; }
        public string? NitCliente { get; set; }
    }
}
