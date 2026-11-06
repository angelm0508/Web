using System.Security.Claims;
using System.Text.Json;
using Web.ApiClient.Dtos;
using Web.ApiClient.Dtos.CreditoCliente;
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

        /// <summary>
        /// Las cifras del rechazo (límite, saldo, comprometido, vencido) son las del estado de cuenta: sin EstadoCuenta / Ver
        /// el rechazo conserva solo el código y un mensaje genérico (la API sí las envía, el Web no las reenvía al navegador).
        /// Con el permiso, o si la respuesta no es un rechazo por crédito, la respuesta queda igual.
        /// </summary>
        public static RespuestaCredito<T> Proteger<T>(ClaimsPrincipal user, RespuestaCredito<T> respuesta)
        {
            if (respuesta.Credito is null || user.TienePermiso("EstadoCuenta", Accion.Ver))
                return respuesta;

            var codigo = respuesta.Credito.Codigo;
            respuesta.Mensaje = codigo == "CLIENTE_CON_VENCIDO"
                ? "El cliente tiene saldo vencido y está bloqueado para nuevos documentos."
                : "El cliente excede su límite de crédito.";
            respuesta.Credito = new CreditoExcedidoDTO { Codigo = codigo, Oculto = true };
            return respuesta;
        }
    }
}
