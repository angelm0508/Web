using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Rendering;
using System.Linq;
using Web.ApiClient.Clientes;
using Web.ApiClient.Dtos.FacturaCompra;
using Web.ApiClient.Dtos.FacturaCompraDetalle;

namespace Web.UI.Controllers
{
    [Authorize]
    public class FacturasCompraController : Controller
    {
        private readonly IFacturaCompraApiClient _facturasCompra;
        private readonly IFacturaCompraDetalleApiClient _detalles;
        private readonly ISocioNegocioApiClient _socios;
        private readonly IMonedaApiClient _monedas;
        private readonly IArticuloApiClient _articulos;
        private readonly IAlmacenApiClient _almacenes;
        private readonly IImpuestoApiClient _impuestos;
        private readonly INumeracionDocumentoDetApiClient _series;
        private readonly INumeracionDocumentoApiClient _numeracion;

        // CodigoObj de NumeracionDocumento que identifica a "Facturas de compra" como tipo de objeto.
        private const string CodigoObjFacturaCompra = "13";
        private const string SubTipoDocFacturaCompra = "--";

        public FacturasCompraController(
            IFacturaCompraApiClient facturasCompra,
            IFacturaCompraDetalleApiClient detalles,
            ISocioNegocioApiClient socios,
            IMonedaApiClient monedas,
            IArticuloApiClient articulos,
            IAlmacenApiClient almacenes,
            IImpuestoApiClient impuestos,
            INumeracionDocumentoDetApiClient series,
            INumeracionDocumentoApiClient numeracion)
        {
            _facturasCompra = facturasCompra;
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
            var respuesta = await _facturasCompra.ObtenerTodoAsync();
            return Json(respuesta);
        }

        [HttpGet]
        public async Task<IActionResult> FormularioCrear()
        {
            await CargarDropdownsAsync();
            var series = await _series.ObtenerPorDocumentoAsync(CodigoObjFacturaCompra);
            ViewBag.SeriesFacturaCompra = (series.Dato ?? []).Where(s => s.SubTipoDoc == SubTipoDocFacturaCompra);

            // Serie preseleccionada: la que está configurada como "por defecto" para este objeto en
            // la pantalla "Numeración de documentos" (NumeracionDocumento.SerieDfct).
            var numeraciones = await _numeracion.ObtenerTodoAsync();
            var numeracionActual = (numeraciones.Dato ?? []).FirstOrDefault(n => n.CodigoObj == CodigoObjFacturaCompra && n.SubTipoDoc == SubTipoDocFacturaCompra);
            ViewBag.SerieDefecto = numeracionActual?.SerieDfct;

            ViewBag.EsEdicion = false;
            return PartialView("_Form", new FacturaCompraCrearDTO { EstadoDoc = "A", TipoObjeto = "13" });
        }

        [HttpGet]
        public async Task<IActionResult> FormularioEditar(int entry)
        {
            var respuesta = await _facturasCompra.ObtenerAsync(entry);
            if (!respuesta.Resultado || respuesta.Dato is null)
                return NotFound();

            await CargarDropdownsAsync();
            ViewBag.EsEdicion = true;
            ViewBag.EntryActual = entry;

            var serieInfo = await _series.ObtenerAsync(respuesta.Dato.Serie);
            ViewBag.NombreSerieActual = serieInfo.Resultado ? serieInfo.Dato?.NombreSerie : null;

            var dto = new FacturaCompraCrearDTO
            {
                NumDoc = respuesta.Dato.NumDoc,
                Serie = respuesta.Dato.Serie,
                Cancelado = respuesta.Dato.Cancelado,
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
        public async Task<IActionResult> Crear([FromBody] FacturaCompraCrearDTO dto)
        {
            var respuesta = await _facturasCompra.InsertarAsync(dto);
            if (!respuesta.Resultado)
                return Json(respuesta);

            var creado = await _facturasCompra.ObtenerAsync(respuesta.Dato);
            return Json(new { respuesta.Resultado, respuesta.Mensaje, dato = respuesta.Dato, numDoc = creado.Dato?.NumDoc });
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Editar(int entry, [FromBody] FacturaCompraCrearDTO dto)
        {
            var actual = await _facturasCompra.ObtenerAsync(entry);
            if (!actual.Resultado || actual.Dato is null)
                return NotFound(actual);

            var actualizar = new FacturaCompraActualizarDTO
            {
                NumDoc = actual.Dato.NumDoc,
                Serie = actual.Dato.Serie,
                Cancelado = dto.Cancelado,
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

            var respuesta = await _facturasCompra.ActualizarAsync(entry, actualizar);
            return Json(respuesta);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Eliminar(int entry)
        {
            var respuesta = await _facturasCompra.EliminarAsync(entry);
            return Json(respuesta);
        }

        [HttpGet]
        public async Task<IActionResult> ObtenerDetalle(int entry)
        {
            var respuesta = await _detalles.ObtenerPorFacturaCompraAsync(entry);
            return Json(respuesta);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> CrearLinea([FromBody] FacturaCompraDetalleCrearDTO dto)
        {
            var respuesta = await _detalles.InsertarAsync(dto);
            return Json(respuesta);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> EditarLinea(int entry, int noLinea, [FromBody] FacturaCompraDetalleActualizarDTO dto)
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

        [HttpGet]
        public async Task<IActionResult> BuscarSocios(string texto)
        {
            var respuesta = string.IsNullOrEmpty(texto)
                ? await _socios.ObtenerTodoAsync("P")
                : await _socios.ObtenerContenganNombreAsync(texto, "P");
            return Json(respuesta);
        }

        [HttpGet]
        public async Task<IActionResult> BuscarArticulos(string texto)
        {
            var respuesta = string.IsNullOrEmpty(texto)
                ? await _articulos.ObtenerTodoAsync()
                : await _articulos.ObtenerContenganNombreAsync(texto);
            return Json(respuesta);
        }

        [HttpGet]
        public async Task<IActionResult> BuscarArticulosPorCodigo(string texto)
        {
            var respuesta = string.IsNullOrEmpty(texto)
                ? await _articulos.ObtenerTodoAsync()
                : await _articulos.ObtenerContenganCodigoAsync(texto);
            return Json(respuesta);
        }

        [HttpGet]
        public async Task<IActionResult> BuscarAlmacenes(string texto)
        {
            var respuesta = string.IsNullOrEmpty(texto)
                ? await _almacenes.ObtenerTodoAsync()
                : await _almacenes.ObtenerContenganNombreAsync(texto);
            return Json(respuesta);
        }

        [HttpGet]
        public async Task<IActionResult> BuscarImpuestos(string texto)
        {
            var respuesta = string.IsNullOrEmpty(texto)
                ? await _impuestos.ObtenerTodoAsync()
                : await _impuestos.ObtenerContenganNombreAsync(texto);
            return Json(respuesta);
        }

        [HttpGet]
        public async Task<IActionResult> ObtenerAlmacenPorCodigo(string codigo)
        {
            var respuesta = await _almacenes.ObtenerAsync(codigo);
            return Json(respuesta);
        }

        [HttpGet]
        public async Task<IActionResult> ObtenerImpuestoPorCodigo(string codigo)
        {
            var respuesta = await _impuestos.ObtenerAsync(codigo);
            return Json(respuesta);
        }

        private async Task CargarDropdownsAsync()
        {
            // Socio de Negocio, Artículo, Almacén e Impuesto ya no se cargan aquí como lista
            // completa -- el buscador con autocompletado los consulta bajo demanda
            // (BuscarSocios/BuscarArticulos/BuscarAlmacenes/BuscarImpuestos). Moneda sigue siendo
            // un <select> normal.
            var monedas = await _monedas.ObtenerTodoAsync();
            ViewBag.Monedas = new SelectList(monedas.Dato ?? [], "Codigo", "Nombre");
        }
    }
}
