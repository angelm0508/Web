using Web.ApiClient.Dtos.Pos;

namespace Web.UI.Models
{
    /// <summary>
    /// Datos que la pantalla del punto de venta necesita al cargar: la configuración (o lo que le falta), el cliente por
    /// defecto, la tasa del impuesto (solo para el total ESTIMADO: los importes finales los fija la API) y las formas de pago.
    /// </summary>
    public class PosPantallaModelo
    {
        /// <summary>Lo que impide vender (faltantes de la configuración o un error al leerla). Vacío = la pantalla funciona.</summary>
        public List<string> Faltantes { get; set; } = new();

        /// <summary>Mensaje de la API si no se pudo leer la configuración.</summary>
        public string? ErrorCarga { get; set; }

        public string ClienteCodigo { get; set; } = string.Empty;
        public string ClienteNombre { get; set; } = string.Empty;
        public string ClienteNit { get; set; } = string.Empty;

        public string? CodigoImpuesto { get; set; }
        public decimal TasaImpuesto { get; set; }

        /// <summary>False si no se pudo leer la tasa del impuesto: el total estimado se muestra sin IVA y con un aviso.</summary>
        public bool TasaDisponible { get; set; }

        public string? FormaPagoEfectivo { get; set; }
        public string? Moneda { get; set; }

        /// <summary>Formas de pago activas; la de efectivo de la configuración va primero.</summary>
        public List<FormaPagoPos> FormasPago { get; set; } = new();

        /// <summary>Permiso <c>Pos.Agregar</c>: sin él la pantalla se puede consultar pero no cobrar.</summary>
        public bool PuedeCobrar { get; set; }

        /// <summary>Permiso <c>PosConfiguracion.Ver</c>: para enlazar la configuración desde el aviso de faltantes.</summary>
        public bool PuedeConfigurar { get; set; }
    }
}
