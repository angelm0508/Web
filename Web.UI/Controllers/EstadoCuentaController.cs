using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Text.Json;
using Web.ApiClient.Clientes;
using Web.UI.Authorization;

namespace Web.UI.Controllers
{
    [Authorize]
    public class EstadoCuentaController : Controller
    {
        private static readonly JsonSerializerOptions JsonWeb = new(JsonSerializerDefaults.Web);

        private readonly IEstadoCuentaApiClient _estadoCuenta;
        private readonly ISocioNegocioApiClient _socios;

        public EstadoCuentaController(IEstadoCuentaApiClient estadoCuenta, ISocioNegocioApiClient socios)
        {
            _estadoCuenta = estadoCuenta;
            _socios = socios;
        }

        // Página del estado de cuenta. codigoSn (opcional, p. ej. desde la ficha del socio) precarga el socio y consulta de inmediato.
        // Rango por defecto: 1 de enero del año en curso a hoy (el mismo que aplica la API).
        [HttpGet]
        [RequierePermiso("EstadoCuenta", Accion.Ver)]
        public async Task<IActionResult> Index(string? codigoSn = null, DateTime? desde = null, DateTime? hasta = null)
        {
            var hoy = DateTime.Today;
            string? nombreSn = null;
            if (!string.IsNullOrWhiteSpace(codigoSn))
            {
                var socio = await _socios.ObtenerAsync(codigoSn);
                nombreSn = socio.Dato?.Nombre;
            }

            ViewBag.DatosInicio = JsonSerializer.Serialize(new
            {
                codigoSn = string.IsNullOrWhiteSpace(codigoSn) ? null : codigoSn,
                nombreSn,
                desde = (desde ?? new DateTime(hoy.Year, 1, 1)).ToString("yyyy-MM-dd"),
                hasta = (hasta ?? hoy).ToString("yyyy-MM-dd")
            }, JsonWeb).Replace("</", "<\\/");
            return View();
        }

        // Estado de cuenta como Respuesta JSON: los errores de la API (socio inexistente, fechas inválidas) viajan en "mensaje".
        [HttpGet]
        [RequierePermiso("EstadoCuenta", Accion.Ver)]
        public async Task<IActionResult> ObtenerEstadoCuenta(string codigoSn, DateTime? desde = null, DateTime? hasta = null)
        {
            var respuesta = await _estadoCuenta.ObtenerAsync(codigoSn, desde, hasta);
            return Json(respuesta);
        }

        // Buscador de socios sin filtro de tipo (clientes y proveedores).
        [HttpGet]
        [RequierePermiso("EstadoCuenta", Accion.Ver)]
        public async Task<IActionResult> BuscarSocios(string texto)
        {
            var respuesta = string.IsNullOrEmpty(texto)
                ? await _socios.ObtenerTodoAsync()
                : await _socios.ObtenerContenganNombreAsync(texto);
            return Json(respuesta);
        }
    }
}
