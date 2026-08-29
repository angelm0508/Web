using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Web.ApiClient.Clientes;
using Web.ApiClient.Dtos;
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

        public IActionResult Clientes()
        {
            ViewBag.TipoGrupo = "C";
            ViewBag.Titulo = "Clientes";
            return View("Index");
        }

        public IActionResult Proveedores()
        {
            ViewBag.TipoGrupo = "P";
            ViewBag.Titulo = "Proveedores";
            return View("Index");
        }

        [HttpGet]
        public async Task<IActionResult> ObtenerTodos(string tipoGrupo)
        {
            var respuesta = await _grupos.ObtenerTodoAsync();

            var filtrado = (respuesta.Dato ?? Enumerable.Empty<GrupoSnDTO>())
                .Where(x => x.TipoGrupo == tipoGrupo);

            var respuestaFiltrada = new Respuesta<IEnumerable<GrupoSnDTO>>
            {
                Dato = filtrado,
                Resultado = respuesta.Resultado,
                Mensaje = respuesta.Mensaje
            };

            return Json(respuestaFiltrada);
        }

        [HttpGet]
        public IActionResult FormularioCrear(string tipoGrupo)
        {
            ViewBag.EsEdicion = false;
            ViewBag.TipoGrupo = tipoGrupo;
            return PartialView("_Form", new GrupoSnCrearDTO());
        }

        [HttpGet]
        public async Task<IActionResult> FormularioEditar(int id)
        {
            var respuesta = await _grupos.ObtenerAsync(id);
            if (!respuesta.Resultado || respuesta.Dato is null)
                return NotFound();

            ViewBag.EsEdicion = true;
            ViewBag.Id = id;
            ViewBag.TipoGrupo = respuesta.Dato.TipoGrupo;

            var dto = new GrupoSnCrearDTO
            {
                Nombre = respuesta.Dato.Nombre
            };

            return PartialView("_Form", dto);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Crear([FromBody] GrupoSnCrearDTO dto, string tipoGrupo)
        {
            dto.TipoGrupo = tipoGrupo;
            var respuesta = await _grupos.InsertarAsync(dto);
            return Json(respuesta);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Editar(int id, [FromBody] GrupoSnCrearDTO dto, string tipoGrupo)
        {
            // Bloqueado ya no se edita desde este formulario -- se conserva el valor actual.
            var actual = await _grupos.ObtenerAsync(id);
            if (!actual.Resultado || actual.Dato is null)
                return NotFound(actual);

            var actualizar = new GrupoSnActualizarDTO
            {
                Nombre = dto.Nombre,
                TipoGrupo = tipoGrupo,
                Bloqueado = actual.Dato.Bloqueado
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
