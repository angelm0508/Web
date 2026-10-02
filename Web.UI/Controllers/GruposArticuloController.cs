using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Web.ApiClient.Clientes;
using Web.ApiClient.Dtos.GrupoArticulo;
using Web.UI.Authorization;

namespace Web.UI.Controllers
{
    [Authorize]
    public class GruposArticuloController : Controller
    {
        private readonly IGrupoArticuloApiClient _grupos;

        public GruposArticuloController(IGrupoArticuloApiClient grupos)
        {
            _grupos = grupos;
        }

        [RequierePermiso("GruposArticulo", Accion.Ver)]
        public IActionResult Index() => View();

        [HttpGet]
        [RequierePermiso("GruposArticulo", Accion.Ver)]
        public async Task<IActionResult> ObtenerTodos()
        {
            var respuesta = await _grupos.ObtenerTodoAsync();
            return Json(respuesta);
        }

        [HttpGet]
        [RequierePermiso("GruposArticulo", Accion.Agregar)]
        public IActionResult FormularioCrear()
        {
            ViewBag.EsEdicion = false;
            ViewBag.Id = 0;
            return PartialView("_Form", new GrupoArticuloCrearDTO());
        }

        [HttpGet]
        [RequierePermiso("GruposArticulo", Accion.Actualizar)]
        public async Task<IActionResult> FormularioEditar(int id)
        {
            var respuesta = await _grupos.ObtenerAsync(id);
            if (!respuesta.Resultado || respuesta.Dato is null)
                return NotFound();

            ViewBag.EsEdicion = true;
            ViewBag.Id = id;

            var dto = new GrupoArticuloCrearDTO
            {
                Nombre = respuesta.Dato.Nombre ?? string.Empty
            };

            return PartialView("_Form", dto);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        [RequierePermiso("GruposArticulo", Accion.Agregar)]
        public async Task<IActionResult> Crear([FromBody] GrupoArticuloCrearDTO dto)
        {
            var respuesta = await _grupos.InsertarAsync(dto);
            return Json(respuesta);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        [RequierePermiso("GruposArticulo", Accion.Actualizar)]
        public async Task<IActionResult> Editar(int id, [FromBody] GrupoArticuloCrearDTO dto)
        {
            // Bloqueado ya no se edita desde este formulario -- se conserva el valor actual.
            var actual = await _grupos.ObtenerAsync(id);
            if (!actual.Resultado || actual.Dato is null)
                return NotFound(actual);

            var actualizar = new GrupoArticuloActualizarDTO
            {
                Nombre = dto.Nombre,
                Bloqueado = actual.Dato.Bloqueado
            };

            var respuesta = await _grupos.ActualizarAsync(id, actualizar);
            return Json(respuesta);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        [RequierePermiso("GruposArticulo", Accion.Eliminar)]
        public async Task<IActionResult> Eliminar(int id)
        {
            var respuesta = await _grupos.EliminarAsync(id);
            return Json(respuesta);
        }
    }
}
