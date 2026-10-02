using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Web.ApiClient.Clientes;
using Web.ApiClient.Dtos.FabricanteArticulo;
using Web.UI.Authorization;

namespace Web.UI.Controllers
{
    [Authorize]
    public class FabricantesController : Controller
    {
        private readonly IFabricanteArticuloApiClient _fabricantes;

        public FabricantesController(IFabricanteArticuloApiClient fabricantes)
        {
            _fabricantes = fabricantes;
        }

        [RequierePermiso("Fabricantes", Accion.Ver)]
        public IActionResult Index() => View();

        [HttpGet]
        [RequierePermiso("Fabricantes", Accion.Ver)]
        public async Task<IActionResult> ObtenerTodos()
        {
            var respuesta = await _fabricantes.ObtenerTodoAsync();
            return Json(respuesta);
        }

        [HttpGet]
        [RequierePermiso("Fabricantes", Accion.Agregar)]
        public IActionResult FormularioCrear()
        {
            ViewBag.EsEdicion = false;
            ViewBag.Id = 0;
            return PartialView("_Form", new FabricanteArticuloCrearDTO());
        }

        [HttpGet]
        [RequierePermiso("Fabricantes", Accion.Actualizar)]
        public async Task<IActionResult> FormularioEditar(int id)
        {
            var respuesta = await _fabricantes.ObtenerAsync(id);
            if (!respuesta.Resultado || respuesta.Dato is null)
                return NotFound();

            ViewBag.EsEdicion = true;
            ViewBag.Id = id;

            var dto = new FabricanteArticuloCrearDTO
            {
                Nombre = respuesta.Dato.Nombre
            };

            return PartialView("_Form", dto);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        [RequierePermiso("Fabricantes", Accion.Agregar)]
        public async Task<IActionResult> Crear([FromBody] FabricanteArticuloCrearDTO dto)
        {
            var respuesta = await _fabricantes.InsertarAsync(dto);
            return Json(respuesta);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        [RequierePermiso("Fabricantes", Accion.Actualizar)]
        public async Task<IActionResult> Editar(int id, [FromBody] FabricanteArticuloCrearDTO dto)
        {
            var actualizar = new FabricanteArticuloActualizarDTO
            {
                Nombre = dto.Nombre
            };

            var respuesta = await _fabricantes.ActualizarAsync(id, actualizar);
            return Json(respuesta);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        [RequierePermiso("Fabricantes", Accion.Eliminar)]
        public async Task<IActionResult> Eliminar(int id)
        {
            var respuesta = await _fabricantes.EliminarAsync(id);
            return Json(respuesta);
        }
    }
}
