using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Text.Json;
using Web.ApiClient.Clientes;
using Web.ApiClient.Dtos.PagoEfectuado;
using Web.UI.Authorization;

namespace Web.UI.Controllers
{
    [Authorize]
    public class PagosEfectuadosController : Controller
    {
        private const string CodigoObjPago = "46";
        private const string SubTipoDocPago = "--";
        private static readonly JsonSerializerOptions JsonWeb = new(JsonSerializerDefaults.Web);

        private readonly IPagoEfectuadoApiClient _pagos;
        private readonly IFormaPagoApiClient _formas;
        private readonly ISocioNegocioApiClient _socios;
        private readonly INumeracionDocumentoDetApiClient _series;
        private readonly INumeracionDocumentoApiClient _numeracion;

        public PagosEfectuadosController(
            IPagoEfectuadoApiClient pagos,
            IFormaPagoApiClient formas,
            ISocioNegocioApiClient socios,
            INumeracionDocumentoDetApiClient series,
            INumeracionDocumentoApiClient numeracion)
        {
            _pagos = pagos;
            _formas = formas;
            _socios = socios;
            _series = series;
            _numeracion = numeracion;
        }

        [RequierePermiso("PagosEfectuados", Accion.Ver)]
        public IActionResult Index() => View();

        [HttpGet]
        [RequierePermiso("PagosEfectuados", Accion.Ver)]
        public async Task<IActionResult> ObtenerTodos()
        {
            var respuesta = await _pagos.ObtenerTodoAsync();
            return Json(respuesta);
        }

        // Página de alta. codigoSn + facturaCompraEntry (opcionales) llegan desde el botón "Registrar pago" de los listados:
        // precargan el proveedor y marcan ese documento por su saldo completo. El servidor revalida todo al guardar.
        [HttpGet]
        [RequierePermiso("PagosEfectuados", Accion.Agregar)]
        public async Task<IActionResult> Crear(string? codigoSn = null, int? facturaCompraEntry = null)
        {
            var series = await _series.ObtenerPorDocumentoAsync(CodigoObjPago);
            ViewBag.Series = (series.Dato ?? []).Where(s => s.SubTipoDoc == SubTipoDocPago && s.Bloqueado != "S").ToList();

            // Serie preseleccionada: la configurada como "por defecto" en "Numeración de documentos".
            var numeraciones = await _numeracion.ObtenerTodoAsync();
            ViewBag.SerieDefecto = (numeraciones.Dato ?? [])
                .FirstOrDefault(n => n.CodigoObj == CodigoObjPago && n.SubTipoDoc == SubTipoDocPago)?.SerieDfct;

            var formas = await _formas.ObtenerTodoAsync();
            var formasActivas = (formas.Dato ?? [])
                .Where(f => f.Activo == "S")
                .OrderBy(f => f.Nombre)
                .Select(f => new { codigo = f.Codigo, nombre = f.Nombre, tipoDato = f.TipoDato })
                .ToList();

            string? nombreSn = null;
            if (!string.IsNullOrWhiteSpace(codigoSn))
            {
                var socio = await _socios.ObtenerAsync(codigoSn);
                nombreSn = socio.Dato?.Nombre;
            }

            ViewBag.DatosInicio = JsonSerializer.Serialize(new { formas = formasActivas, codigoSn, nombreSn, facturaCompraEntry }, JsonWeb)
                .Replace("</", "<\\/");
            return View();
        }

        [HttpGet]
        [RequierePermiso("PagosEfectuados", Accion.Agregar)]
        public async Task<IActionResult> BuscarSocios(string texto)
        {
            var respuesta = string.IsNullOrEmpty(texto)
                ? await _socios.ObtenerTodoAsync("P")
                : await _socios.ObtenerContenganNombreAsync(texto, "P");
            return Json(respuesta);
        }

        [HttpGet]
        [RequierePermiso("PagosEfectuados", Accion.Agregar)]
        public async Task<IActionResult> DocumentosPorPagar(string codigoSn)
        {
            var respuesta = await _pagos.ObtenerDocumentosPorPagarAsync(codigoSn);
            return Json(respuesta);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        [RequierePermiso("PagosEfectuados", Accion.Agregar)]
        public async Task<IActionResult> Crear([FromBody] PagoEfectuadoCrearDTO dto)
        {
            var respuesta = await _pagos.InsertarAsync(dto);
            return Json(respuesta);
        }

        // Detalle de solo lectura (modal): cabecera, documentos aplicados y formas de pago.
        [HttpGet]
        [RequierePermiso("PagosEfectuados", Accion.Ver)]
        public async Task<IActionResult> Detalle(int entry)
        {
            var pago = await _pagos.ObtenerAsync(entry);
            if (!pago.Resultado || pago.Dato is null)
                return NotFound();

            var facturas = await _pagos.ObtenerFacturasAsync(entry);
            var medios = await _pagos.ObtenerMediosAsync(entry);
            ViewBag.Facturas = facturas.Dato ?? [];
            ViewBag.Medios = medios.Dato ?? [];
            return PartialView("_Detalle", pago.Dato);
        }

        // Cancelar un pago es anularlo: requiere Eliminar (convención: 'cancelar documento -> Eliminar').
        [HttpPost]
        [ValidateAntiForgeryToken]
        [RequierePermiso("PagosEfectuados", Accion.Eliminar)]
        public async Task<IActionResult> Cancelar(int entry)
        {
            var respuesta = await _pagos.CancelarAsync(entry);
            return Json(respuesta);
        }
    }
}
