using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Web.ApiClient.Clientes;
using Web.ApiClient.Dtos;
using Web.ApiClient.Dtos.Reporte;

namespace Web.UI.Controllers
{
    // Sin permiso a nivel de clase ni por acción: cada reporte pertenece a un módulo (ReportesVentas, ReportesCompras, ...)
    // y es la API la que lo evalúa en cada llamada (catálogo, definición, ejecución y exportación). Aquí solo se exige sesión.
    [Authorize]
    public class ReportesController : Controller
    {
        private readonly IReporteApiClient _reportes;
        private readonly ISocioNegocioApiClient _socios;
        private readonly IArticuloApiClient _articulos;
        private readonly IAlmacenApiClient _almacenes;

        public ReportesController(IReporteApiClient reportes, ISocioNegocioApiClient socios, IArticuloApiClient articulos, IAlmacenApiClient almacenes)
        {
            _reportes = reportes;
            _socios = socios;
            _articulos = articulos;
            _almacenes = almacenes;
        }

        [HttpGet]
        public async Task<IActionResult> Index()
        {
            var catalogo = await _reportes.ObtenerCatalogoAsync();
            ViewBag.Error = catalogo.Resultado ? null : catalogo.Mensaje;
            return View(catalogo.Dato ?? new List<ReporteResumenDTO>());
        }

        [HttpGet]
        public IActionResult Ver(string codigo)
        {
            if (string.IsNullOrWhiteSpace(codigo)) return RedirectToAction(nameof(Index));
            ViewBag.Codigo = codigo;
            return View();
        }

        [HttpGet]
        public async Task<IActionResult> Definicion(string codigo) => RespuestaJson(await _reportes.ObtenerDefinicionAsync(codigo));

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Ejecutar(string codigo, [FromBody] JsonElement solicitud) =>
            RespuestaJson(await _reportes.EjecutarAsync(codigo, solicitud));

        // Cuando la API rechaza la petición, Dato queda como un JsonElement sin valor (Undefined) y System.Text.Json no puede
        // serializarlo (500). En ese caso se devuelve "dato": null para que el navegador reciba el mensaje de la API.
        private JsonResult RespuestaJson(Respuesta<JsonElement> respuesta) =>
            Json(new
            {
                resultado = respuesta.Resultado,
                mensaje = respuesta.Mensaje,
                dato = respuesta.Dato.ValueKind == JsonValueKind.Undefined ? (JsonElement?)null : respuesta.Dato
            });

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Exportar(string codigo, string formato, [FromBody] JsonElement cuerpo)
        {
            var archivo = await _reportes.ExportarAsync(codigo, formato, cuerpo);
            if (archivo.Contenido is null)
                return BadRequest(new { resultado = false, mensaje = archivo.Error ?? "No se pudo generar el archivo." });
            return File(archivo.Contenido, archivo.ContentType, archivo.NombreArchivo);
        }

        // Vistas guardadas del usuario: la API las limita a las propias; "configuracion" viaja como objeto JSON sin tocar.
        [HttpGet]
        public async Task<IActionResult> Vistas(string codigo) => RespuestaJson(await _reportes.ObtenerVistasAsync(codigo));

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> GuardarVista(string codigo, [FromBody] JsonElement vista) =>
            RespuestaJson(await _reportes.GuardarVistaAsync(codigo, vista));

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> EliminarVista(string codigo, int entry) =>
            Json(await _reportes.EliminarVistaAsync(codigo, entry));

        // Buscadores de los filtros de socio, artículo y almacén (los usa App.autocompletar).
        [HttpGet]
        public async Task<IActionResult> BuscarSocios(string? texto, string? tipo)
        {
            var respuesta = string.IsNullOrEmpty(texto)
                ? await _socios.ObtenerTodoAsync(tipo)
                : await _socios.ObtenerContenganNombreAsync(texto, tipo);
            return Json(respuesta);
        }

        [HttpGet]
        public async Task<IActionResult> BuscarArticulos(string? texto)
        {
            var respuesta = string.IsNullOrEmpty(texto)
                ? await _articulos.ObtenerTodoAsync()
                : await _articulos.ObtenerContenganNombreAsync(texto);
            return Json(respuesta);
        }

        [HttpGet]
        public async Task<IActionResult> BuscarAlmacenes(string? texto)
        {
            var respuesta = string.IsNullOrEmpty(texto)
                ? await _almacenes.ObtenerTodoAsync()
                : await _almacenes.ObtenerContenganNombreAsync(texto);
            return Json(respuesta);
        }
    }
}
