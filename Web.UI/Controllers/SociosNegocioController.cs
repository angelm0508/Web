using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Rendering;
using Web.ApiClient.Clientes;
using Web.ApiClient.Dtos.DireccionSocioNegocio;
using Web.ApiClient.Dtos.SocioNegocio;

namespace Web.UI.Controllers
{
    [Authorize]
    public class SociosNegocioController : Controller
    {
        private readonly ISocioNegocioApiClient _socios;
        private readonly IGrupoSnApiClient _grupos;
        private readonly IListadoPrecioApiClient _listadosPrecio;
        private readonly IDireccionSocioNegocioApiClient _direcciones;
        private readonly IPaisApiClient _paises;
        private readonly IDepartamentoApiClient _departamentos;
        private readonly IMunicipioApiClient _municipios;

        public SociosNegocioController(
            ISocioNegocioApiClient socios,
            IGrupoSnApiClient grupos,
            IListadoPrecioApiClient listadosPrecio,
            IDireccionSocioNegocioApiClient direcciones,
            IPaisApiClient paises,
            IDepartamentoApiClient departamentos,
            IMunicipioApiClient municipios)
        {
            _socios = socios;
            _grupos = grupos;
            _listadosPrecio = listadosPrecio;
            _direcciones = direcciones;
            _paises = paises;
            _departamentos = departamentos;
            _municipios = municipios;
        }

        public IActionResult Index() => View();

        [HttpGet]
        public async Task<IActionResult> ObtenerTodos()
        {
            var respuesta = await _socios.ObtenerTodoAsync();
            return Json(respuesta);
        }

        [HttpGet]
        public async Task<IActionResult> FormularioCrear()
        {
            await CargarDropdownsAsync();
            await CargarUbicacionesAsync();
            ViewBag.EsEdicion = false;
            return PartialView("_Form", new SocioNegocioCrearDTO { Activo = "S" });
        }

        [HttpGet]
        public async Task<IActionResult> FormularioEditar(string codigo)
        {
            var respuesta = await _socios.ObtenerAsync(codigo);
            if (!respuesta.Resultado || respuesta.Dato is null)
                return NotFound();

            await CargarDropdownsAsync();
            await CargarUbicacionesAsync();
            ViewBag.EsEdicion = true;

            var dto = new SocioNegocioCrearDTO
            {
                Codigo = codigo,
                Nombre = respuesta.Dato.Nombre,
                TipoSn = respuesta.Dato.TipoSn,
                GrupoSn = respuesta.Dato.GrupoSn,
                Cui = respuesta.Dato.Cui,
                Nit = respuesta.Dato.Nit,
                PersContacto = respuesta.Dato.PersContacto,
                Tel1 = respuesta.Dato.Tel1,
                Tel2 = respuesta.Dato.Tel2,
                Descuento = respuesta.Dato.Descuento,
                NumLstPrecio = respuesta.Dato.NumLstPrecio,
                Email = respuesta.Dato.Email,
                Activo = respuesta.Dato.Activo
            };

            return PartialView("_Form", dto);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Crear([FromBody] SocioNegocioCrearDTO dto)
        {
            var respuesta = await _socios.InsertarAsync(dto);
            return Json(respuesta);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Editar(string codigo, [FromBody] SocioNegocioCrearDTO dto)
        {
            var actualizar = new SocioNegocioActualizarDTO
            {
                Nombre = dto.Nombre,
                TipoSn = dto.TipoSn,
                GrupoSn = dto.GrupoSn,
                Cui = dto.Cui,
                Nit = dto.Nit,
                PersContacto = dto.PersContacto,
                Tel1 = dto.Tel1,
                Tel2 = dto.Tel2,
                Descuento = dto.Descuento,
                NumLstPrecio = dto.NumLstPrecio,
                Email = dto.Email,
                Activo = dto.Activo
            };

            var respuesta = await _socios.ActualizarAsync(codigo, actualizar);
            return Json(respuesta);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Eliminar(string codigo)
        {
            var respuesta = await _socios.EliminarAsync(codigo);
            return Json(respuesta);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> CrearDireccion([FromBody] DireccionSocioNegocioCrearDTO dto)
        {
            var respuesta = await _direcciones.InsertarAsync(dto);
            return Json(respuesta);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> EditarDireccion(string direccion, [FromBody] DireccionSocioNegocioActualizarDTO dto)
        {
            var respuesta = await _direcciones.ActualizarAsync(direccion, dto);
            return Json(respuesta);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> EliminarDireccion(string direccion)
        {
            var respuesta = await _direcciones.EliminarAsync(direccion);
            return Json(respuesta);
        }

        private async Task CargarDropdownsAsync()
        {
            var grupos = await _grupos.ObtenerTodoAsync();
            var listadosPrecio = await _listadosPrecio.ObtenerTodoAsync();

            ViewBag.Grupos = new SelectList(grupos.Dato ?? [], "Entry", "Nombre");
            ViewBag.ListadosPrecio = new SelectList(listadosPrecio.Dato ?? [], "Entry", "Nombre");
        }

        private async Task CargarUbicacionesAsync()
        {
            var paises = await _paises.ObtenerTodoAsync();
            var departamentos = await _departamentos.ObtenerTodoAsync();
            var municipios = await _municipios.ObtenerTodoAsync();

            // Mismo patrón que Almacenes: País se renderiza como <select> normal; Departamento y
            // Municipio dependen en cascada del país/departamento elegido, así que se pasan las
            // listas completas para filtrarlas en el navegador (catálogos pequeños).
            ViewBag.Paises = new SelectList(paises.Dato ?? [], "Codigo", "Nombre");
            ViewBag.Departamentos = departamentos.Dato ?? [];
            ViewBag.Municipios = municipios.Dato ?? [];
        }
    }
}
