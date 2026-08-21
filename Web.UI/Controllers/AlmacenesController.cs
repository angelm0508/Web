using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Rendering;
using Web.ApiClient.Clientes;
using Web.ApiClient.Dtos.Almacen;

namespace Web.UI.Controllers
{
    [Authorize]
    public class AlmacenesController : Controller
    {
        private readonly IAlmacenApiClient _almacenes;
        private readonly IPaisApiClient _paises;
        private readonly IDepartamentoApiClient _departamentos;
        private readonly IMunicipioApiClient _municipios;

        public AlmacenesController(
            IAlmacenApiClient almacenes,
            IPaisApiClient paises,
            IDepartamentoApiClient departamentos,
            IMunicipioApiClient municipios)
        {
            _almacenes = almacenes;
            _paises = paises;
            _departamentos = departamentos;
            _municipios = municipios;
        }

        public IActionResult Index() => View();

        [HttpGet]
        public async Task<IActionResult> ObtenerTodos()
        {
            var respuesta = await _almacenes.ObtenerTodoAsync();
            return Json(respuesta);
        }

        [HttpGet]
        public async Task<IActionResult> FormularioCrear()
        {
            await CargarUbicacionesAsync();
            ViewBag.EsEdicion = false;
            return PartialView("_Form", new AlmacenCrearDTO { Activo = "S", Bloqueado = "N" });
        }

        [HttpGet]
        public async Task<IActionResult> FormularioEditar(string codigo)
        {
            var respuesta = await _almacenes.ObtenerAsync(codigo);
            if (!respuesta.Resultado || respuesta.Dato is null)
                return NotFound();

            await CargarUbicacionesAsync();
            ViewBag.EsEdicion = true;

            var dto = new AlmacenCrearDTO
            {
                Codigo = codigo,
                Nombre = respuesta.Dato.Nombre,
                Activo = respuesta.Dato.Activo,
                Calle = respuesta.Dato.Calle,
                CodigoPostal = respuesta.Dato.CodigoPostal,
                Pais = respuesta.Dato.Pais,
                Municipio = respuesta.Dato.Municipio,
                Departamento = respuesta.Dato.Departamento,
                Bloqueado = respuesta.Dato.Bloqueado
            };

            return PartialView("_Form", dto);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Crear([FromBody] AlmacenCrearDTO dto)
        {
            var respuesta = await _almacenes.InsertarAsync(dto);
            return Json(respuesta);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Editar(string codigo, [FromBody] AlmacenCrearDTO dto)
        {
            var actualizar = new AlmacenActualizarDTO
            {
                Nombre = dto.Nombre,
                Activo = dto.Activo,
                Calle = dto.Calle,
                CodigoPostal = dto.CodigoPostal,
                Pais = dto.Pais,
                Municipio = dto.Municipio,
                Departamento = dto.Departamento,
                Bloqueado = dto.Bloqueado
            };

            var respuesta = await _almacenes.ActualizarAsync(codigo, actualizar);
            return Json(respuesta);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Eliminar(string codigo)
        {
            var respuesta = await _almacenes.EliminarAsync(codigo);
            return Json(respuesta);
        }

        private async Task CargarUbicacionesAsync()
        {
            var paises = await _paises.ObtenerTodoAsync();
            var departamentos = await _departamentos.ObtenerTodoAsync();
            var municipios = await _municipios.ObtenerTodoAsync();

            // País se puede renderizar server-side como <select> normal. Departamento y Municipio
            // dependen en cascada del país/departamento elegido, así que se pasan las listas
            // completas (son catálogos pequeños) para que el JS del formulario las filtre en el
            // navegador sin ida y vuelta al servidor por cada selección.
            ViewBag.Paises = new SelectList(paises.Dato ?? [], "Codigo", "Nombre");
            ViewBag.Departamentos = departamentos.Dato ?? [];
            ViewBag.Municipios = municipios.Dato ?? [];
        }
    }
}
