using System.Security.Claims;
using System.Text.Json;
using Web.UI.Authorization;

namespace Web.UI.Controllers
{
    /// <summary>
    /// Permisos de crédito de los formularios de pedido, entrega y factura de venta. Las tres pantallas comparten
    /// estos cálculos, que se hacen siempre en el servidor (el JS solo recibe el resultado).
    /// </summary>
    internal static class CreditoDocumento
    {
        private static readonly JsonSerializerOptions JsonWeb = new(JsonSerializerDefaults.Web);

        /// <summary>
        /// JSON para <c>&lt;script id="datosCredito"&gt;</c> del formulario: si el usuario puede consultar la posición de
        /// crédito del cliente (EstadoCuenta / Ver) y si puede autorizar excesos (AutorizarExcesoCredito / Ver).
        /// </summary>
        public static string Datos(ClaimsPrincipal user) =>
            JsonSerializer.Serialize(new
            {
                puedeVerCredito = user.TienePermiso("EstadoCuenta", Accion.Ver),
                puedeAutorizar = user.TienePermiso("AutorizarExcesoCredito", Accion.Ver)
            }, JsonWeb).Replace("</", "<\\/");

        /// <summary>
        /// La bandera «autorizar exceso» que viaja a la API: solo si el JS la pidió (únicamente desde el diálogo de
        /// confirmación) y el usuario tiene el permiso; sin él se descarta y la API rechaza con 409 como siempre.
        /// </summary>
        public static bool Autoriza(ClaimsPrincipal user, bool solicitada) =>
            solicitada && user.TienePermiso("AutorizarExcesoCredito", Accion.Ver);
    }
}
