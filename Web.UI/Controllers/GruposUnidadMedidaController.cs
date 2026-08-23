using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Rendering;
using Web.ApiClient.Clientes;
using Web.ApiClient.Dtos.GrupoUnidadMedidaArticulo;
using Web.ApiClient.Dtos.GrupoUnidadMedidaDetArticulo;

namespace Web.UI.Controllers
{
    [Authorize]
    public class GruposUnidadMedidaController : Controller
    {
        private readonly IGrupoUnidadMedidaArticuloApiClient _grupos;
        private readonly IGrupoUnidadMedidaDetArticuloApiClient _detalles;
        private readonly IUnidadMedidaArticuloApiClient _unidades;

        public GruposUnidadMedidaController(
            IGrupoUnidadMedidaArticuloApiClient grupos,
            IGrupoUnidadMedidaDetArticuloApiClient detalles,
            IUnidadMedidaArticuloApiClient unidades)
        {
            _grupos = grupos;
            _detalles = detalles;
            _unidades = unidades;
        }

        public IActionResult Index() => View();

        [HttpGet]
        public async Task<IActionResult> ObtenerTodos()
        {
            var respuesta = await _grupos.ObtenerTodoAsync();
            return Json(respuesta);
        }

        [HttpGet]
        public async Task<IActionResult> FormularioCrear()
        {
            await CargarUnidadesAsync();
            ViewBag.EsEdicion = false;
            ViewBag.Id = 0;
            return PartialView("_Form", new GrupoUnidadMedidaArticuloCrearDTO { Bloqueado = "N" });
        }

        [HttpGet]
        public async Task<IActionResult> FormularioEditar(int id)
        {
            var respuesta = await _grupos.ObtenerAsync(id);
            if (!respuesta.Resultado || respuesta.Dato is null)
                return NotFound();

            await CargarUnidadesAsync();
            ViewBag.EsEdicion = true;
            ViewBag.Id = id;

            var dto = new GrupoUnidadMedidaArticuloCrearDTO
            {
                Nombre = respuesta.Dato.Nombre,
                BaseMedida = respuesta.Dato.BaseMedida,
                Bloqueado = respuesta.Dato.Bloqueado
            };

            return PartialView("_Form", dto);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Crear([FromBody] GrupoUnidadMedidaArticuloCrearDTO dto)
        {
            var respuesta = await _grupos.InsertarAsync(dto);
            return Json(respuesta);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Editar(int id, [FromBody] GrupoUnidadMedidaArticuloCrearDTO dto)
        {
            var actualizar = new GrupoUnidadMedidaArticuloActualizarDTO
            {
                Nombre = dto.Nombre,
                BaseMedida = dto.BaseMedida,
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

        [HttpGet]
        public async Task<IActionResult> ObtenerDetalle(int grpMedidaEntry)
        {
            var respuesta = await _detalles.ObtenerPorGrupoAsync(grpMedidaEntry);
            return Json(respuesta);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> CrearLinea([FromBody] GrupoUnidadMedidaDetArticuloCrearDTO dto)
        {
            var respuesta = await _detalles.InsertarAsync(dto);
            return Json(respuesta);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> EditarLinea(int grpMedidaEntry, int numLinea, [FromBody] GrupoUnidadMedidaDetArticuloActualizarDTO dto)
        {
            var respuesta = await _detalles.ActualizarAsync(grpMedidaEntry, numLinea, dto);
            return Json(respuesta);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> EliminarLinea(int grpMedidaEntry, int numLinea)
        {
            var respuesta = await _detalles.EliminarAsync(grpMedidaEntry, numLinea);
            return Json(respuesta);
        }

        private async Task CargarUnidadesAsync()
        {
            var unidades = await _unidades.ObtenerTodoAsync();
            ViewBag.Unidades = new SelectList(unidades.Dato ?? [], "Entry", "Nombre");
        }
    }
}
