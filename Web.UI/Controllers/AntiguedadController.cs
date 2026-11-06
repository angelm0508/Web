using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Web.ApiClient.Clientes;
using Web.UI.Authorization;

namespace Web.UI.Controllers
{
    // Sin permiso a nivel de clase: cada lado (por cobrar / por pagar) tiene su propio módulo de permisos
    // y TODAS las acciones de un lado, páginas y datos, exigen el permiso de ese mismo lado.
    [Authorize]
    public class AntiguedadController : Controller
    {
        private readonly IAntiguedadApiClient _antiguedad;

        public AntiguedadController(IAntiguedadApiClient antiguedad)
        {
            _antiguedad = antiguedad;
        }

        [HttpGet]
        [RequierePermiso("AntiguedadCobrar", Accion.Ver)]
        public IActionResult Cobrar() => View();

        [HttpGet]
        [RequierePermiso("AntiguedadPagar", Accion.Ver)]
        public IActionResult Pagar() => View();

        [HttpGet]
        [RequierePermiso("AntiguedadCobrar", Accion.Ver)]
        public async Task<IActionResult> ObtenerCobrar()
        {
            var respuesta = await _antiguedad.ObtenerCobrarAsync();
            return Json(respuesta);
        }

        [HttpGet]
        [RequierePermiso("AntiguedadPagar", Accion.Ver)]
        public async Task<IActionResult> ObtenerPagar()
        {
            var respuesta = await _antiguedad.ObtenerPagarAsync();
            return Json(respuesta);
        }

        // Documentos abiertos de un socio (modal de solo lectura).
        [HttpGet]
        [RequierePermiso("AntiguedadCobrar", Accion.Ver)]
        public async Task<IActionResult> DetalleCobrar(string codigoSn, string? nombreSn = null)
        {
            if (string.IsNullOrWhiteSpace(codigoSn))
                return BadRequest("El código del socio es requerido.");

            var respuesta = await _antiguedad.ObtenerDetalleCobrarAsync(codigoSn);
            return DetalleParcial(respuesta, codigoSn, nombreSn);
        }

        [HttpGet]
        [RequierePermiso("AntiguedadPagar", Accion.Ver)]
        public async Task<IActionResult> DetallePagar(string codigoSn, string? nombreSn = null)
        {
            if (string.IsNullOrWhiteSpace(codigoSn))
                return BadRequest("El código del socio es requerido.");

            var respuesta = await _antiguedad.ObtenerDetallePagarAsync(codigoSn);
            return DetalleParcial(respuesta, codigoSn, nombreSn);
        }

        private IActionResult DetalleParcial(
            Web.ApiClient.Dtos.Respuesta<List<Web.ApiClient.Dtos.Antiguedad.DocumentoAntiguedadDTO>> respuesta,
            string codigoSn,
            string? nombreSn)
        {
            if (!respuesta.Resultado || respuesta.Dato is null)
                return BadRequest(string.IsNullOrWhiteSpace(respuesta.Mensaje) ? "No se pudo cargar el detalle." : respuesta.Mensaje);

            ViewBag.CodigoSn = codigoSn;
            ViewBag.NombreSn = nombreSn;
            return PartialView("_Detalle", respuesta.Dato);
        }
    }
}
