using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Rendering;
using System.Linq;
using Web.ApiClient.Clientes;
using Web.ApiClient.Dtos.Entrega;
using Web.ApiClient.Dtos.EntregaDetalle;

namespace Web.UI.Controllers
{
    [Authorize]
    public class EntregasController : Controller
    {
        private readonly IEntregaApiClient _entregas;
        private readonly IEntregaDetalleApiClient _detalles;
        private readonly ISocioNegocioApiClient _socios;
        private readonly IMonedaApiClient _monedas;
        private readonly IArticuloApiClient _articulos;
        private readonly IAlmacenApiClient _almacenes;
        private readonly IImpuestoApiClient _impuestos;
        private readonly INumeracionDocumentoDetApiClient _series;

        // CodigoObj de NumeracionDocumento que identifica a "Entregas" como tipo de objeto.
        private const string CodigoObjEntrega = "5";
        private const string SubTipoDocEntrega = "--";

        public EntregasController(
            IEntregaApiClient entregas,
            IEntregaDetalleApiClient detalles,
            ISocioNegocioApiClient socios,
            IMonedaApiClient monedas,
            IArticuloApiClient articulos,
            IAlmacenApiClient almacenes,
            IImpuestoApiClient impuestos,
            INumeracionDocumentoDetApiClient series)
        {
            _entregas = entregas;
            _detalles = detalles;
            _socios = socios;
            _monedas = monedas;
            _articulos = articulos;
            _almacenes = almacenes;
            _impuestos = impuestos;
            _series = series;
        }

        public IActionResult Index() => View();

        [HttpGet]
        public async Task<IActionResult> ObtenerTodos()
        {
            var respuesta = await _entregas.ObtenerTodoAsync();
            return Json(respuesta);
        }

        [HttpGet]
        public async Task<IActionResult> FormularioCrear()
        {
            await CargarDropdownsAsync();
            var series = await _series.ObtenerPorDocumentoAsync(CodigoObjEntrega);
            ViewBag.SeriesEntrega = (series.Dato ?? []).Where(s => s.SubTipoDoc == SubTipoDocEntrega);
            ViewBag.EsEdicion = false;
            return PartialView("_Form", new EntregaCrearDTO { EstadoDoc = "A", TipoObjeto = "5" });
        }

        [HttpGet]
        public async Task<IActionResult> FormularioEditar(int entry)
        {
            var respuesta = await _entregas.ObtenerAsync(entry);
            if (!respuesta.Resultado || respuesta.Dato is null)
                return NotFound();

            await CargarDropdownsAsync();
            ViewBag.EsEdicion = true;
            ViewBag.EntryActual = entry;

            var serieInfo = await _series.ObtenerAsync(respuesta.Dato.Serie);
            ViewBag.NombreSerieActual = serieInfo.Resultado ? serieInfo.Dato?.NombreSerie : null;

            var dto = new EntregaCrearDTO
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
        public async Task<IActionResult> Crear([FromBody] EntregaCrearDTO dto)
        {
            var respuesta = await _entregas.InsertarAsync(dto);
            if (!respuesta.Resultado)
                return Json(respuesta);

            var creado = await _entregas.ObtenerAsync(respuesta.Dato);
            return Json(new { respuesta.Resultado, respuesta.Mensaje, dato = respuesta.Dato, numDoc = creado.Dato?.NumDoc });
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Editar(int entry, [FromBody] EntregaCrearDTO dto)
        {
            var actual = await _entregas.ObtenerAsync(entry);
            if (!actual.Resultado || actual.Dato is null)
                return NotFound(actual);

            var actualizar = new EntregaActualizarDTO
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

            var respuesta = await _entregas.ActualizarAsync(entry, actualizar);
            return Json(respuesta);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Eliminar(int entry)
        {
            var respuesta = await _entregas.EliminarAsync(entry);
            return Json(respuesta);
        }

        [HttpGet]
        public async Task<IActionResult> ObtenerDetalle(int entry)
        {
            var respuesta = await _detalles.ObtenerPorEntregaAsync(entry);
            return Json(respuesta);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> CrearLinea([FromBody] EntregaDetalleCrearDTO dto)
        {
            var respuesta = await _detalles.InsertarAsync(dto);
            return Json(respuesta);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> EditarLinea(int entry, int noLinea, [FromBody] EntregaDetalleActualizarDTO dto)
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
