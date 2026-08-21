using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Web.ApiClient.Clientes;
using Web.ApiClient.Dtos.MedidaArticulo;

namespace Web.UI.Controllers
{
    [Authorize]
    public class MedidasController : Controller
    {
        private readonly IMedidaArticuloApiClient _medidas;

        public MedidasController(IMedidaArticuloApiClient medidas)
        {
            _medidas = medidas;
        }

        public IActionResult Index() => View();

        [HttpGet]
        public async Task<IActionResult> ObtenerTodos()
        {
            var respuesta = await _medidas.ObtenerTodoAsync();
            return Json(respuesta);
        }

        [HttpGet]
        public IActionResult FormularioCrear()
        {
            ViewBag.EsEdicion = false;
            ViewBag.Id = 0;
            return PartialView("_Form", new MedidaArticuloCrearDTO { Bloqueado = "N" });
        }

        [HttpGet]
        public async Task<IActionResult> FormularioEditar(int id)
        {
            var respuesta = await _medidas.ObtenerAsync(id);
            if (!respuesta.Resultado || respuesta.Dato is null)
                return NotFound();

            ViewBag.EsEdicion = true;
            ViewBag.Id = id;

            var dto = new MedidaArticuloCrearDTO
            {
                Codigo = respuesta.Dato.Codigo,
                Nombre = respuesta.Dato.Nombre,
                Largo = respuesta.Dato.Largo,
                Ancho = respuesta.Dato.Ancho,
                Altura = respuesta.Dato.Altura,
                Volumen = respuesta.Dato.Volumen,
                Peso = respuesta.Dato.Peso,
                Bloqueado = respuesta.Dato.Bloqueado
            };

            return PartialView("_Form", dto);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Crear([FromBody] MedidaArticuloCrearDTO dto)
        {
            var respuesta = await _medidas.InsertarAsync(dto);
            return Json(respuesta);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Editar(int id, [FromBody] MedidaArticuloCrearDTO dto)
        {
            // La API exige el campo Codigo en el body de PUT api/MedidaArticulo/{id} aunque el id
            // real se toma de la ruta -- se envía el mismo código que tenía el formulario, no el id numérico.
            var actualizar = new MedidaArticuloActualizarDTO
            {
                Codigo = dto.Codigo,
                Nombre = dto.Nombre,
                Largo = dto.Largo,
                Ancho = dto.Ancho,
                Altura = dto.Altura,
                Volumen = dto.Volumen,
                Peso = dto.Peso,
                Bloqueado = dto.Bloqueado
            };

            var respuesta = await _medidas.ActualizarAsync(id, actualizar);
            return Json(respuesta);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Eliminar(int id)
        {
            var respuesta = await _medidas.EliminarAsync(id);
            return Json(respuesta);
        }
    }
}
