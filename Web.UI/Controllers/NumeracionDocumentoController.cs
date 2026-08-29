using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Web.ApiClient.Clientes;
using Web.ApiClient.Dtos.NumeracionDocumento;
using Web.ApiClient.Dtos.NumeracionDocumentoDet;

namespace Web.UI.Controllers
{
    [Authorize]
    public class NumeracionDocumentoController : Controller
    {
        private readonly INumeracionDocumentoApiClient _numeraciones;
        private readonly INumeracionDocumentoDetApiClient _detalles;

        public NumeracionDocumentoController(INumeracionDocumentoApiClient numeraciones, INumeracionDocumentoDetApiClient detalles)
        {
            _numeraciones = numeraciones;
            _detalles = detalles;
        }

        public IActionResult Index() => View();

        [HttpGet]
        public async Task<IActionResult> ObtenerTodos()
        {
            var respuestaCabeceras = await _numeraciones.ObtenerTodoAsync();
            if (!respuestaCabeceras.Resultado || respuestaCabeceras.Dato is null)
            {
                return Json(new { dato = (object?)null, resultado = respuestaCabeceras.Resultado, mensaje = respuestaCabeceras.Mensaje });
            }

            var respuestaDetalles = await _detalles.ObtenerTodoAsync();
            var detalles = (respuestaDetalles.Resultado ? respuestaDetalles.Dato : null) ?? Enumerable.Empty<NumeracionDocumentoDetDTO>();

            // La lista combina el encabezado con los datos de su "serie por defecto"
            // (la línea de detalle cuya Serie coincide con NumeracionDocumento.SerieDfct).
            var filas = respuestaCabeceras.Dato.Select(c =>
            {
                var serieDefecto = c.SerieDfct.HasValue
                    ? detalles.FirstOrDefault(d => d.Serie == c.SerieDfct.Value)
                    : null;

                return new
                {
                    codigoObj = c.CodigoObj,
                    docAlias = c.DocAlias,
                    nombreSerieDefecto = serieDefecto?.NombreSerie,
                    iniNumero = serieDefecto?.IniNumero,
                    sigNumero = serieDefecto?.SigNumero,
                    finNumero = serieDefecto?.FinNumero
                };
            }).ToList();

            return Json(new { dato = filas, resultado = true, mensaje = respuestaCabeceras.Mensaje });
        }

        [HttpGet]
        public async Task<IActionResult> FormularioEditar(string codigo)
        {
            var respuesta = await _numeraciones.ObtenerAsync(codigo);
            if (!respuesta.Resultado || respuesta.Dato is null)
                return NotFound();

            ViewBag.EsEdicion = true;

            var dto = new NumeracionDocumentoCrearDTO
            {
                CodigoObj = codigo,
                SerieDfct = respuesta.Dato.SerieDfct,
                DocAlias = respuesta.Dato.DocAlias,
                SubTipoDoc = respuesta.Dato.SubTipoDoc
            };

            return PartialView("_Form", dto);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Editar(string codigo, [FromBody] NumeracionDocumentoCrearDTO dto)
        {
            // El subtipo de documento está deshabilitado en el formulario de edición (no viaja en
            // el body), así que se conserva el valor actual en vez de confiar en lo que llegue.
            var actual = await _numeraciones.ObtenerAsync(codigo);
            if (!actual.Resultado || actual.Dato is null)
                return NotFound(actual);

            var actualizar = new NumeracionDocumentoActualizarDTO
            {
                SerieDfct = dto.SerieDfct,
                DocAlias = dto.DocAlias,
                SubTipoDoc = actual.Dato.SubTipoDoc
            };

            var respuesta = await _numeraciones.ActualizarAsync(codigo, actualizar);
            return Json(respuesta);
        }

        [HttpGet]
        public async Task<IActionResult> ObtenerDetalle(string codigoObj)
        {
            var respuesta = await _detalles.ObtenerPorDocumentoAsync(codigoObj);
            return Json(respuesta);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> CrearLinea([FromBody] NumeracionDocumentoDetCrearDTO dto)
        {
            var respuesta = await _detalles.InsertarAsync(dto);
            return Json(respuesta);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> EditarLinea(int serie, [FromBody] NumeracionDocumentoDetActualizarDTO dto)
        {
            // Bloqueado ya no se edita desde este formulario -- se conserva el valor actual.
            var actual = await _detalles.ObtenerAsync(serie);
            if (!actual.Resultado || actual.Dato is null)
                return NotFound(actual);

            dto.Bloqueado = actual.Dato.Bloqueado;

            var respuesta = await _detalles.ActualizarAsync(serie, dto);
            return Json(respuesta);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> EliminarLinea(int serie)
        {
            var respuesta = await _detalles.EliminarAsync(serie);
            return Json(respuesta);
        }
    }
}
