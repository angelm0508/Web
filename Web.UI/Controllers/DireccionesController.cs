using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Rendering;
using Web.ApiClient.Clientes;
using Web.ApiClient.Dtos.DireccionSocioNegocio;

namespace Web.UI.Controllers
{
    [Authorize]
    public class DireccionesController : Controller
    {
        private readonly IDireccionSocioNegocioApiClient _direcciones;
        private readonly ISocioNegocioApiClient _socios;

        public DireccionesController(
            IDireccionSocioNegocioApiClient direcciones,
            ISocioNegocioApiClient socios)
        {
            _direcciones = direcciones;
            _socios = socios;
        }

        public IActionResult Index() => View();

        [HttpGet]
        public async Task<IActionResult> ObtenerTodos()
        {
            var respuesta = await _direcciones.ObtenerTodoAsync();
            return Json(respuesta);
        }

        [HttpGet]
        public async Task<IActionResult> FormularioCrear()
        {
            await CargarDropdownsAsync();
            ViewBag.EsEdicion = false;
            return PartialView("_Form", new DireccionSocioNegocioCrearDTO());
        }

        [HttpGet]
        public async Task<IActionResult> FormularioEditar(string direccion)
        {
            var respuesta = await _direcciones.ObtenerAsync(direccion);
            if (!respuesta.Resultado || respuesta.Dato is null)
                return NotFound();

            await CargarDropdownsAsync();
            ViewBag.EsEdicion = true;

            var dto = new DireccionSocioNegocioCrearDTO
            {
                Direccion = direccion,
                CodigoSn = respuesta.Dato.CodigoSn,
                Calle = respuesta.Dato.Calle,
                Bloque = respuesta.Dato.Bloque,
                CodigoPostal = respuesta.Dato.CodigoPostal,
                Pais = respuesta.Dato.Pais,
                Municipio = respuesta.Dato.Municipio,
                Departamento = respuesta.Dato.Departamento,
                NumLinea = respuesta.Dato.NumLinea,
                TipoDireccion = respuesta.Dato.TipoDireccion
            };

            return PartialView("_Form", dto);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Crear([FromBody] DireccionSocioNegocioCrearDTO dto)
        {
            var respuesta = await _direcciones.InsertarAsync(dto);
            return Json(respuesta);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Editar(string direccion, [FromBody] DireccionSocioNegocioCrearDTO dto)
        {
            var actualizar = new DireccionSocioNegocioActualizarDTO
            {
                Calle = dto.Calle,
                Bloque = dto.Bloque,
                CodigoPostal = dto.CodigoPostal,
                Pais = dto.Pais,
                Municipio = dto.Municipio,
                Departamento = dto.Departamento,
                NumLinea = dto.NumLinea,
                TipoDireccion = dto.TipoDireccion
            };

            var respuesta = await _direcciones.ActualizarAsync(direccion, actualizar);
            return Json(respuesta);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Eliminar(string direccion)
        {
            var respuesta = await _direcciones.EliminarAsync(direccion);
            return Json(respuesta);
        }

        private async Task CargarDropdownsAsync()
        {
            var socios = await _socios.ObtenerTodoAsync();
            ViewBag.Socios = new SelectList(socios.Dato ?? [], "Codigo", "Nombre");
        }
    }
}
