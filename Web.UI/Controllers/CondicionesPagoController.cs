using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Web.ApiClient.Clientes;
using Web.ApiClient.Dtos.CondicionPago;
using Web.UI.Authorization;

namespace Web.UI.Controllers
{
    [Authorize]
    public class CondicionesPagoController : Controller
    {
        private readonly ICondicionPagoApiClient _condiciones;

        public CondicionesPagoController(ICondicionPagoApiClient condiciones)
        {
            _condiciones = condiciones;
        }

        [RequierePermiso("CondicionesPago", Accion.Ver)]
        public IActionResult Index() => View();

        [HttpGet]
        [RequierePermiso("CondicionesPago", Accion.Ver)]
        public async Task<IActionResult> ObtenerTodos()
        {
            var respuesta = await _condiciones.ObtenerTodoAsync();
            return Json(respuesta);
        }

        [HttpGet]
        [RequierePermiso("CondicionesPago", Accion.Agregar)]
        public IActionResult FormularioCrear()
        {
            ViewBag.EsEdicion = false;
            return PartialView("_Form", new CondicionPagoCrearDTO { Activo = "S" });
        }

        [HttpGet]
        [RequierePermiso("CondicionesPago", Accion.Actualizar)]
        public async Task<IActionResult> FormularioEditar(string codigo)
        {
            var respuesta = await _condiciones.ObtenerAsync(codigo);
            if (!respuesta.Resultado || respuesta.Dato is null)
                return NotFound();

            ViewBag.EsEdicion = true;
            var dto = new CondicionPagoCrearDTO
            {
                Codigo = respuesta.Dato.Codigo,
                Nombre = respuesta.Dato.Nombre,
                Dias = respuesta.Dato.Dias,
                Activo = respuesta.Dato.Activo
            };
            return PartialView("_Form", dto);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        [RequierePermiso("CondicionesPago", Accion.Agregar)]
        public async Task<IActionResult> Crear([FromBody] CondicionPagoCrearDTO dto)
        {
            var respuesta = await _condiciones.InsertarAsync(dto);
            return Json(respuesta);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        [RequierePermiso("CondicionesPago", Accion.Actualizar)]
        public async Task<IActionResult> Editar(string codigo, [FromBody] CondicionPagoCrearDTO dto)
        {
            var actualizar = new CondicionPagoActualizarDTO { Nombre = dto.Nombre, Dias = dto.Dias, Activo = dto.Activo };
            var respuesta = await _condiciones.ActualizarAsync(codigo, actualizar);
            return Json(respuesta);
        }

        // Baja lógica: la condición pasa a inactiva (puede estar asignada a socios y documentos). CON no se puede dar de baja.
        [HttpPost]
        [ValidateAntiForgeryToken]
        [RequierePermiso("CondicionesPago", Accion.Eliminar)]
        public async Task<IActionResult> Eliminar(string codigo)
        {
            var respuesta = await _condiciones.EliminarAsync(codigo);
            return Json(respuesta);
        }
    }
}
