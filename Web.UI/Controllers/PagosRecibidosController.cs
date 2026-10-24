using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Web.ApiClient.Clientes;
using Web.UI.Authorization;

namespace Web.UI.Controllers
{
    [Authorize]
    public class PagosRecibidosController : Controller
    {
        private readonly IPagoRecibidoApiClient _pagos;

        public PagosRecibidosController(IPagoRecibidoApiClient pagos)
        {
            _pagos = pagos;
        }

        [RequierePermiso("PagosRecibidos", Accion.Ver)]
        public IActionResult Index() => View();

        [HttpGet]
        [RequierePermiso("PagosRecibidos", Accion.Ver)]
        public async Task<IActionResult> ObtenerTodos()
        {
            var respuesta = await _pagos.ObtenerTodoAsync();
            return Json(respuesta);
        }

        // Detalle de solo lectura (modal): cabecera, documentos aplicados y formas de pago.
        [HttpGet]
        [RequierePermiso("PagosRecibidos", Accion.Ver)]
        public async Task<IActionResult> Detalle(int entry)
        {
            var pago = await _pagos.ObtenerAsync(entry);
            if (!pago.Resultado || pago.Dato is null)
                return NotFound();

            var facturas = await _pagos.ObtenerFacturasAsync(entry);
            var medios = await _pagos.ObtenerMediosAsync(entry);
            ViewBag.Facturas = facturas.Dato ?? [];
            ViewBag.Medios = medios.Dato ?? [];
            return PartialView("_Detalle", pago.Dato);
        }

        // Cancelar un pago es anularlo: requiere Eliminar (convención: 'cancelar documento -> Eliminar').
        [HttpPost]
        [ValidateAntiForgeryToken]
        [RequierePermiso("PagosRecibidos", Accion.Eliminar)]
        public async Task<IActionResult> Cancelar(int entry)
        {
            var respuesta = await _pagos.CancelarAsync(entry);
            return Json(respuesta);
        }
    }
}
