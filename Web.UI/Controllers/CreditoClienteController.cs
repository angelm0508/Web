using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Web.ApiClient.Clientes;
using Web.ApiClient.Dtos;
using Web.ApiClient.Dtos.CreditoCliente;
using Web.UI.Authorization;

namespace Web.UI.Controllers
{
    /// <summary>Posición de crédito de un cliente para los formularios de pedido, entrega y factura de venta (compartida por los tres).</summary>
    [Authorize]
    public class CreditoClienteController : Controller
    {
        private readonly ICreditoClienteApiClient _credito;

        public CreditoClienteController(ICreditoClienteApiClient credito)
        {
            _credito = credito;
        }

        /// <summary>
        /// Límite, saldo, comprometido y disponible del cliente. Se exige EstadoCuenta / Ver aquí (no solo se oculta en el JS):
        /// sin el permiso responde un Respuesta denegado sin llamar a la API. Es JSON (no una redirección) porque lo consume un fetch.
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> PosicionCredito(string codigoSn)
        {
            if (!User.TienePermiso("EstadoCuenta", Accion.Ver))
                return Json(new Respuesta<PosicionCreditoDTO> { Resultado = false, Mensaje = "No tienes permiso para consultar el crédito del cliente." });

            if (string.IsNullOrWhiteSpace(codigoSn))
                return Json(new Respuesta<PosicionCreditoDTO> { Resultado = false, Mensaje = "El código del cliente es requerido." });

            var respuesta = await _credito.ObtenerAsync(codigoSn.Trim());
            return Json(respuesta);
        }
    }
}
