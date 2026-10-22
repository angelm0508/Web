using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Web.ApiClient.Clientes;
using Web.ApiClient.Dtos.Mecanico;
using Web.UI.Authorization;

namespace Web.UI.Controllers
{
    [Authorize]
    public class MecanicosController : Controller
    {
        private readonly IMecanicoApiClient _mecanicos;

        public MecanicosController(IMecanicoApiClient mecanicos)
        {
            _mecanicos = mecanicos;
        }

        [RequierePermiso("Mecanicos", Accion.Ver)]
        public IActionResult Index() => View();

        [HttpGet]
        [RequierePermiso("Mecanicos", Accion.Ver)]
        public async Task<IActionResult> ObtenerTodos()
        {
            var respuesta = await _mecanicos.ObtenerTodoAsync();
            return Json(respuesta);
        }

        [HttpGet]
        [RequierePermiso("Mecanicos", Accion.Agregar)]
        public IActionResult FormularioCrear()
        {
            ViewBag.EsEdicion = false;
            return PartialView("_Form", new MecanicoCrearDTO { Activo = "S" });
        }

        [HttpGet]
        [RequierePermiso("Mecanicos", Accion.Actualizar)]
        public async Task<IActionResult> FormularioEditar(string codigo)
        {
            var respuesta = await _mecanicos.ObtenerAsync(codigo);
            if (!respuesta.Resultado || respuesta.Dato is null)
                return NotFound();

            ViewBag.EsEdicion = true;
            var dto = new MecanicoCrearDTO
            {
                Codigo = respuesta.Dato.Codigo,
                Nombre = respuesta.Dato.Nombre,
                Telefono = respuesta.Dato.Telefono,
                Activo = respuesta.Dato.Activo
            };
            return PartialView("_Form", dto);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        [RequierePermiso("Mecanicos", Accion.Agregar)]
        public async Task<IActionResult> Crear([FromBody] MecanicoCrearDTO dto)
        {
            var respuesta = await _mecanicos.InsertarAsync(dto);
            return Json(respuesta);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        [RequierePermiso("Mecanicos", Accion.Actualizar)]
        public async Task<IActionResult> Editar(string codigo, [FromBody] MecanicoCrearDTO dto)
        {
            var actualizar = new MecanicoActualizarDTO { Nombre = dto.Nombre, Telefono = dto.Telefono, Activo = dto.Activo };
            var respuesta = await _mecanicos.ActualizarAsync(codigo, actualizar);
            return Json(respuesta);
        }

        // Baja lógica: el mecánico pasa a inactivo (puede tener órdenes de servicio).
        [HttpPost]
        [ValidateAntiForgeryToken]
        [RequierePermiso("Mecanicos", Accion.Eliminar)]
        public async Task<IActionResult> Eliminar(string codigo)
        {
            var respuesta = await _mecanicos.EliminarAsync(codigo);
            return Json(respuesta);
        }
    }
}
