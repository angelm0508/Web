using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Web.ApiClient.Clientes;
using Web.ApiClient.Dtos.FormaPago;
using Web.UI.Authorization;

namespace Web.UI.Controllers
{
    [Authorize]
    public class FormasPagoController : Controller
    {
        private readonly IFormaPagoApiClient _formas;

        public FormasPagoController(IFormaPagoApiClient formas)
        {
            _formas = formas;
        }

        [RequierePermiso("FormasPago", Accion.Ver)]
        public IActionResult Index() => View();

        [HttpGet]
        [RequierePermiso("FormasPago", Accion.Ver)]
        public async Task<IActionResult> ObtenerTodos()
        {
            var respuesta = await _formas.ObtenerTodoAsync();
            return Json(respuesta);
        }

        [HttpGet]
        [RequierePermiso("FormasPago", Accion.Agregar)]
        public IActionResult FormularioCrear()
        {
            ViewBag.EsEdicion = false;
            return PartialView("_Form", new FormaPagoCrearDTO { TipoDato = "N", Activo = "S" });
        }

        [HttpGet]
        [RequierePermiso("FormasPago", Accion.Actualizar)]
        public async Task<IActionResult> FormularioEditar(string codigo)
        {
            var respuesta = await _formas.ObtenerAsync(codigo);
            if (!respuesta.Resultado || respuesta.Dato is null)
                return NotFound();

            ViewBag.EsEdicion = true;
            var dto = new FormaPagoCrearDTO
            {
                Codigo = respuesta.Dato.Codigo,
                Nombre = respuesta.Dato.Nombre,
                TipoDato = respuesta.Dato.TipoDato,
                Activo = respuesta.Dato.Activo
            };
            return PartialView("_Form", dto);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        [RequierePermiso("FormasPago", Accion.Agregar)]
        public async Task<IActionResult> Crear([FromBody] FormaPagoCrearDTO dto)
        {
            var respuesta = await _formas.InsertarAsync(dto);
            return Json(respuesta);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        [RequierePermiso("FormasPago", Accion.Actualizar)]
        public async Task<IActionResult> Editar(string codigo, [FromBody] FormaPagoCrearDTO dto)
        {
            var actualizar = new FormaPagoActualizarDTO { Nombre = dto.Nombre, TipoDato = dto.TipoDato, Activo = dto.Activo };
            var respuesta = await _formas.ActualizarAsync(codigo, actualizar);
            return Json(respuesta);
        }

        // Baja lógica: la forma de pago pasa a inactiva (puede tener pagos registrados).
        [HttpPost]
        [ValidateAntiForgeryToken]
        [RequierePermiso("FormasPago", Accion.Eliminar)]
        public async Task<IActionResult> Eliminar(string codigo)
        {
            var respuesta = await _formas.EliminarAsync(codigo);
            return Json(respuesta);
        }
    }
}
