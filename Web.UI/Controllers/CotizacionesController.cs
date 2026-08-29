using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Rendering;
using System.Linq;
using Web.ApiClient.Clientes;
using Web.ApiClient.Dtos.Cotizacion;
using Web.ApiClient.Dtos.CotizacionDetalle;

namespace Web.UI.Controllers
{
    [Authorize]
    public class CotizacionesController : Controller
    {
        private readonly ICotizacionApiClient _cotizaciones;
        private readonly ICotizacionDetalleApiClient _detalles;
        private readonly ISocioNegocioApiClient _socios;
        private readonly IMonedaApiClient _monedas;
        private readonly IArticuloApiClient _articulos;
        private readonly IAlmacenApiClient _almacenes;
        private readonly IImpuestoApiClient _impuestos;
        private readonly INumeracionDocumentoDetApiClient _series;
        private readonly INumeracionDocumentoApiClient _numeracion;

        // CodigoObj de NumeracionDocumento que identifica a "Cotizaciones" como tipo de objeto.
        private const string CodigoObjCotizacion = "3";
        private const string SubTipoDocCotizacion = "--";

        public CotizacionesController(
            ICotizacionApiClient cotizaciones,
            ICotizacionDetalleApiClient detalles,
            ISocioNegocioApiClient socios,
            IMonedaApiClient monedas,
            IArticuloApiClient articulos,
            IAlmacenApiClient almacenes,
            IImpuestoApiClient impuestos,
            INumeracionDocumentoDetApiClient series,
            INumeracionDocumentoApiClient numeracion)
        {
            _cotizaciones = cotizaciones;
            _detalles = detalles;
            _socios = socios;
            _monedas = monedas;
            _articulos = articulos;
            _almacenes = almacenes;
            _impuestos = impuestos;
            _series = series;
            _numeracion = numeracion;
        }

        public IActionResult Index() => View();

        [HttpGet]
        public async Task<IActionResult> ObtenerTodos()
        {
            var respuesta = await _cotizaciones.ObtenerTodoAsync();
            return Json(respuesta);
        }

        [HttpGet]
        public async Task<IActionResult> FormularioCrear()
        {
            await CargarDropdownsAsync();
            var series = await _series.ObtenerPorDocumentoAsync(CodigoObjCotizacion);
            ViewBag.SeriesCotizacion = (series.Dato ?? []).Where(s => s.SubTipoDoc == SubTipoDocCotizacion);

            // Serie preseleccionada: la que está configurada como "por defecto" para este objeto en
            // la pantalla "Numeración de documentos" (NumeracionDocumento.SerieDfct).
            var numeraciones = await _numeracion.ObtenerTodoAsync();
            var numeracionActual = (numeraciones.Dato ?? []).FirstOrDefault(n => n.CodigoObj == CodigoObjCotizacion && n.SubTipoDoc == SubTipoDocCotizacion);
            ViewBag.SerieDefecto = numeracionActual?.SerieDfct;

            ViewBag.EsEdicion = false;
            return PartialView("_Form", new CotizacionCrearDTO { EstadoDoc = "A", TipoObjeto = "3" });
        }

        [HttpGet]
        public async Task<IActionResult> FormularioEditar(int entry)
        {
            var respuesta = await _cotizaciones.ObtenerAsync(entry);
            if (!respuesta.Resultado || respuesta.Dato is null)
                return NotFound();

            await CargarDropdownsAsync();
            ViewBag.EsEdicion = true;
            ViewBag.EntryActual = entry;

            var serieInfo = await _series.ObtenerAsync(respuesta.Dato.Serie);
            ViewBag.NombreSerieActual = serieInfo.Resultado ? serieInfo.Dato?.NombreSerie : null;

            var dto = new CotizacionCrearDTO
            {
                NumDoc = respuesta.Dato.NumDoc,
                Serie = respuesta.Dato.Serie,
                EstadoDoc = respuesta.Dato.EstadoDoc,
                TipoObjeto = respuesta.Dato.TipoObjeto,
                FechaDoc = respuesta.Dato.FechaDoc,
                FechaEmision = respuesta.Dato.FechaEmision,
                CodigoSn = respuesta.Dato.CodigoSn,
                NombreSn = respuesta.Dato.NombreSn,
                Direccion = respuesta.Dato.Direccion,
                MonedaDoc = respuesta.Dato.MonedaDoc,
                PrctjeImpuesto = respuesta.Dato.PrctjeImpuesto,
                TotalImp = respuesta.Dato.TotalImp,
                PrctjeDesc = respuesta.Dato.PrctjeDesc,
                TotalDesc = respuesta.Dato.TotalDesc,
                TotalBruto = respuesta.Dato.TotalBruto,
                TotalDoc = respuesta.Dato.TotalDoc,
                Comentario = respuesta.Dato.Comentario
            };

            return PartialView("_Form", dto);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Crear([FromBody] CotizacionCrearDTO dto)
        {
            var respuesta = await _cotizaciones.InsertarAsync(dto);
            if (!respuesta.Resultado)
                return Json(respuesta);

            // El No. documento real (para series no manuales, calculado por la API al registrar)
            // no viaja en "respuesta" -- solo trae el Entry. Se consulta el registro recién creado
            // para poder mostrarlo de inmediato en el campo "No. documento" del formulario.
            var creada = await _cotizaciones.ObtenerAsync(respuesta.Dato);
            return Json(new { respuesta.Resultado, respuesta.Mensaje, dato = respuesta.Dato, numDoc = creada.Dato?.NumDoc });
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Editar(int entry, [FromBody] CotizacionCrearDTO dto)
        {
            // NumDoc y Serie no se editan desde este formulario (solo se muestran a modo informativo)
            // -- se conservan los valores actuales en vez de confiar en lo que llegue.
            var actual = await _cotizaciones.ObtenerAsync(entry);
            if (!actual.Resultado || actual.Dato is null)
                return NotFound(actual);

            var actualizar = new CotizacionActualizarDTO
            {
                NumDoc = actual.Dato.NumDoc,
                Serie = actual.Dato.Serie,
                EstadoDoc = dto.EstadoDoc,
                TipoObjeto = dto.TipoObjeto,
                FechaDoc = dto.FechaDoc,
                FechaEmision = dto.FechaEmision,
                CodigoSn = dto.CodigoSn,
                NombreSn = dto.NombreSn,
                Direccion = dto.Direccion,
                MonedaDoc = dto.MonedaDoc,
                PrctjeImpuesto = dto.PrctjeImpuesto,
                TotalImp = dto.TotalImp,
                PrctjeDesc = dto.PrctjeDesc,
                TotalDesc = dto.TotalDesc,
                TotalBruto = dto.TotalBruto,
                TotalDoc = dto.TotalDoc,
                Comentario = dto.Comentario
            };

            var respuesta = await _cotizaciones.ActualizarAsync(entry, actualizar);
            return Json(respuesta);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Eliminar(int entry)
        {
            var respuesta = await _cotizaciones.EliminarAsync(entry);
            return Json(respuesta);
        }

        [HttpGet]
        public async Task<IActionResult> ObtenerDetalle(int entry)
        {
            var respuesta = await _detalles.ObtenerPorCotizacionAsync(entry);
            return Json(respuesta);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> CrearLinea([FromBody] CotizacionDetalleCrearDTO dto)
        {
            var respuesta = await _detalles.InsertarAsync(dto);
            return Json(respuesta);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> EditarLinea(int entry, int noLinea, [FromBody] CotizacionDetalleActualizarDTO dto)
        {
            var respuesta = await _detalles.ActualizarAsync(entry, noLinea, dto);
            return Json(respuesta);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> EliminarLinea(int entry, int noLinea)
        {
            var respuesta = await _detalles.EliminarAsync(entry, noLinea);
            return Json(respuesta);
        }

        private async Task CargarDropdownsAsync()
        {
            var socios = await _socios.ObtenerTodoAsync();
            var monedas = await _monedas.ObtenerTodoAsync();
            var articulos = await _articulos.ObtenerTodoAsync();
            var almacenes = await _almacenes.ObtenerTodoAsync();
            var impuestos = await _impuestos.ObtenerTodoAsync();

            ViewBag.Socios = new SelectList(socios.Dato ?? [], "Codigo", "Nombre");
            ViewBag.Monedas = new SelectList(monedas.Dato ?? [], "Codigo", "Nombre");
            ViewBag.Articulos = articulos.Dato ?? [];
            ViewBag.Almacenes = new SelectList(almacenes.Dato ?? [], "Codigo", "Nombre");
            ViewBag.Impuestos = impuestos.Dato ?? [];
        }
    }
}
