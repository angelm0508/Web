using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Web.ApiClient.Clientes;
using Web.ApiClient.Dtos.GrupoSn;

namespace Web.UI.Controllers
{
    [Authorize]
    public class GruposSnController : Controller
    {
        private readonly IGrupoSnApiClient _grupos;

        public GruposSnController(IGrupoSnApiClient grupos)
        {
            _grupos = grupos;
        }

        public IActionResult Index() => View();

        [HttpGet]
        public async Task<IActionResult> ObtenerTodos()
        {
            var respuesta = await _grupos.ObtenerTodoAsync();
            return Json(respuesta);
        }

        [HttpGet]
        public IActionResult FormularioCrear()
        {
            ViewBag.EsEdicion = false;
            return PartialView("_Form", new GrupoSnCrearDTO { Bloqueado = "N" });
        }

        [HttpGet]
        public async Task<IActionResult> FormularioEditar(int id)
        {
            var respuesta = await _grupos.ObtenerAsync(id);
            if (!respuesta.Resultado || respuesta.Dato is null)
                return NotFound();

            ViewBag.EsEdicion = true;
            ViewBag.Id = id;

            var dto = new GrupoSnCrearDTO
            {
                Nombre = respuesta.Dato.Nombre,
                Bloqueado = respuesta.Dato.Bloqueado
            };

            return PartialView("_Form", dto);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Crear([FromBody] GrupoSnCrearDTO dto)
        {
            var respuesta = await _grupos.InsertarAsync(dto);
            return Json(respuesta);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Editar(int id, [FromBody] GrupoSnCrearDTO dto)
        {
            var actualizar = new GrupoSnActualizarDTO
            {
                Nombre = dto.Nombre,
                Bloqueado = dto.Bloqueado
            };

            var respuesta = await _grupos.ActualizarAsync(id, actualizar);
            return Json(respuesta);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Eliminar(int id)
        {
            var respuesta = await _grupos.EliminarAsync(id);
            return Json(respuesta);
        }
    }
}
