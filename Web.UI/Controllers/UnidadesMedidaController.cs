using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Web.ApiClient.Clientes;
using Web.ApiClient.Dtos.UnidadMedidaArticulo;

namespace Web.UI.Controllers
{
    [Authorize]
    public class UnidadesMedidaController : Controller
    {
        private readonly IUnidadMedidaArticuloApiClient _unidadesMedida;

        public UnidadesMedidaController(IUnidadMedidaArticuloApiClient unidadesMedida)
        {
            _unidadesMedida = unidadesMedida;
        }

        public IActionResult Index() => View();

        [HttpGet]
        public async Task<IActionResult> ObtenerTodos()
        {
            var respuesta = await _unidadesMedida.ObtenerTodoAsync();
            return Json(respuesta);
        }

        [HttpGet]
        public IActionResult FormularioCrear()
        {
            ViewBag.EsEdicion = false;
            ViewBag.Id = 0;
            return PartialView("_Form", new UnidadMedidaArticuloCrearDTO());
        }

        [HttpGet]
        public async Task<IActionResult> FormularioEditar(int id)
        {
            var respuesta = await _unidadesMedida.ObtenerAsync(id);
            if (!respuesta.Resultado || respuesta.Dato is null)
                return NotFound();

            ViewBag.EsEdicion = true;
            ViewBag.Id = id;

            var dto = new UnidadMedidaArticuloCrearDTO
            {
                Codigo = respuesta.Dato.Codigo,
                Nombre = respuesta.Dato.Nombre,
                Largo = respuesta.Dato.Largo,
                Ancho = respuesta.Dato.Ancho,
                Altura = respuesta.Dato.Altura,
                Volumen = respuesta.Dato.Volumen,
                Peso = respuesta.Dato.Peso
            };

            return PartialView("_Form", dto);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Crear([FromBody] UnidadMedidaArticuloCrearDTO dto)
        {
            var respuesta = await _unidadesMedida.InsertarAsync(dto);
            return Json(respuesta);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Editar(int id, [FromBody] UnidadMedidaArticuloCrearDTO dto)
        {
            // Bloqueado ya no se edita desde este formulario -- se conserva el valor actual.
            var actual = await _unidadesMedida.ObtenerAsync(id);
            if (!actual.Resultado || actual.Dato is null)
                return NotFound(actual);

            // La API exige el campo Codigo en el body de PUT api/UnidadMedidaArticulo/{id} aunque el id
            // real se toma de la ruta -- se envía el mismo código que tenía el formulario, no el id numérico.
            var actualizar = new UnidadMedidaArticuloActualizarDTO
            {
                Codigo = dto.Codigo,
                Nombre = dto.Nombre,
                Largo = dto.Largo,
                Ancho = dto.Ancho,
                Altura = dto.Altura,
                Volumen = dto.Volumen,
                Peso = dto.Peso,
                Bloqueado = actual.Dato.Bloqueado
            };

            var respuesta = await _unidadesMedida.ActualizarAsync(id, actualizar);
            return Json(respuesta);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Eliminar(int id)
        {
            var respuesta = await _unidadesMedida.EliminarAsync(id);
            return Json(respuesta);
        }
    }
}
