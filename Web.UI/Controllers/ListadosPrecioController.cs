using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Web.ApiClient.Clientes;
using Web.ApiClient.Dtos.ListadoPrecio;

namespace Web.UI.Controllers
{
    [Authorize]
    public class ListadosPrecioController : Controller
    {
        private readonly IListadoPrecioApiClient _listados;

        public ListadosPrecioController(IListadoPrecioApiClient listados)
        {
            _listados = listados;
        }

        public IActionResult Index() => View();

        [HttpGet]
        public async Task<IActionResult> ObtenerTodos()
        {
            var respuesta = await _listados.ObtenerTodoAsync();
            return Json(respuesta);
        }

        [HttpGet]
        public IActionResult FormularioCrear()
        {
            ViewBag.EsEdicion = false;
            return PartialView("_Form", new ListadoPrecioCrearDTO { Bloqueado = "N" });
        }

        [HttpGet]
        public async Task<IActionResult> FormularioEditar(int id)
        {
            var respuesta = await _listados.ObtenerAsync(id);
            if (!respuesta.Resultado || respuesta.Dato is null)
                return NotFound();

            ViewBag.EsEdicion = true;
            ViewBag.Id = id;

            var dto = new ListadoPrecioCrearDTO
            {
                Nombre = respuesta.Dato.Nombre,
                Bloqueado = respuesta.Dato.Bloqueado
            };

            return PartialView("_Form", dto);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Crear([FromBody] ListadoPrecioCrearDTO dto)
        {
            var respuesta = await _listados.InsertarAsync(dto);
            return Json(respuesta);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Editar(int id, [FromBody] ListadoPrecioCrearDTO dto)
        {
            var actualizar = new ListadoPrecioActualizarDTO
            {
                Nombre = dto.Nombre,
                Bloqueado = dto.Bloqueado
            };

            var respuesta = await _listados.ActualizarAsync(id, actualizar);
            return Json(respuesta);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Eliminar(int id)
        {
            var respuesta = await _listados.EliminarAsync(id);
            return Json(respuesta);
        }
    }
}
