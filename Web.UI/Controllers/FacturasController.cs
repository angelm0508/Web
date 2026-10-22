using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Rendering;
using System.Linq;
using Web.ApiClient.Clientes;
using Web.ApiClient.Dtos.DocumentoBase;
using Web.ApiClient.Dtos.Factura;
using Web.ApiClient.Dtos.FacturaDetalle;
using Web.UI.Authorization;

namespace Web.UI.Controllers
{
    [Authorize]
    public class FacturasController : Controller
    {
        private readonly IFacturaApiClient _facturas;
        private readonly IFacturaDetalleApiClient _detalles;
        private readonly ISocioNegocioApiClient _socios;
        private readonly IMonedaApiClient _monedas;
        private readonly IArticuloApiClient _articulos;
        private readonly IAlmacenApiClient _almacenes;
        private readonly IImpuestoApiClient _impuestos;
        private readonly INumeracionDocumentoDetApiClient _series;
        private readonly INumeracionDocumentoApiClient _numeracion;
        private readonly IDocumentoBaseApiClient _documentoBase;

        // Tipo de objeto de Factura (destino de "Copiar a").
        private const int TipoDestinoFactura = 6;

        // CodigoObj de NumeracionDocumento que identifica a "Facturas" como tipo de objeto.
        private const string CodigoObjFactura = "6";
        private const string SubTipoDocFactura = "--";

        public FacturasController(
            IFacturaApiClient facturas,
            IFacturaDetalleApiClient detalles,
            ISocioNegocioApiClient socios,
            IMonedaApiClient monedas,
            IArticuloApiClient articulos,
            IAlmacenApiClient almacenes,
            IImpuestoApiClient impuestos,
            INumeracionDocumentoDetApiClient series,
            INumeracionDocumentoApiClient numeracion,
            IDocumentoBaseApiClient documentoBase)
        {
            _facturas = facturas;
            _detalles = detalles;
            _socios = socios;
            _monedas = monedas;
            _articulos = articulos;
            _almacenes = almacenes;
            _impuestos = impuestos;
            _series = series;
            _numeracion = numeracion;
            _documentoBase = documentoBase;
        }

        [RequierePermiso("Facturas", Accion.Ver)]
        public IActionResult Index() => View();

        [HttpGet]
        [RequierePermiso("Facturas", Accion.Ver)]
        public async Task<IActionResult> ObtenerTodos()
        {
            var respuesta = await _facturas.ObtenerTodoAsync();
            return Json(respuesta);
        }

        [HttpGet]
        [RequierePermiso("Facturas", Accion.Agregar)]
        public async Task<IActionResult> FormularioCrear(int? baseTipo = null, int? baseEntry = null)
        {
            // "Copiar a": el borrador trae la cabecera y las líneas abiertas del documento origen.
            DocumentoBaseBorradorDTO? borrador = null;
            if (baseTipo.HasValue && baseEntry.HasValue)
            {
                var copia = await _documentoBase.ObtenerBorradorAsync(baseTipo.Value, baseEntry.Value, TipoDestinoFactura);
                if (!copia.Resultado || copia.Dato is null)
                    return BadRequest(copia.Mensaje);   // el JS lo muestra con App.mostrarError
                borrador = copia.Dato;
            }
            ViewBag.Borrador = borrador;

            await CargarDropdownsAsync();
            var series = await _series.ObtenerPorDocumentoAsync(CodigoObjFactura);
            ViewBag.SeriesFactura = (series.Dato ?? []).Where(s => s.SubTipoDoc == SubTipoDocFactura);

            // Serie preseleccionada: la que está configurada como "por defecto" para este objeto en
            // la pantalla "Numeración de documentos" (NumeracionDocumento.SerieDfct).
            var numeraciones = await _numeracion.ObtenerTodoAsync();
            var numeracionActual = (numeraciones.Dato ?? []).FirstOrDefault(n => n.CodigoObj == CodigoObjFactura && n.SubTipoDoc == SubTipoDocFactura);
            ViewBag.SerieDefecto = numeracionActual?.SerieDfct;

            ViewBag.EsEdicion = false;
            var dto = new FacturaCrearDTO { EstadoDoc = "A", TipoObjeto = "6" };
            if (borrador is not null)
            {
                dto.CodigoSn = borrador.Cabecera.CodigoSn;
                dto.NombreSn = borrador.Cabecera.NombreSn;
                dto.Direccion = borrador.Cabecera.Direccion;
                dto.MonedaDoc = borrador.Cabecera.MonedaDoc;
                dto.PrctjeDesc = borrador.Cabecera.PrctjeDesc;
                dto.PrctjeImpuesto = borrador.Cabecera.PrctjeImpuesto;
                dto.Comentario = borrador.Cabecera.Comentario;
                dto.FechaDoc = DateTime.Today;
                dto.FechaEmision = DateTime.Today;
            }
            return PartialView("_Form", dto);
        }

        [HttpGet]
        [RequierePermiso("Facturas", Accion.Ver)]
        public async Task<IActionResult> FormularioEditar(int entry)
        {
            var respuesta = await _facturas.ObtenerAsync(entry);
            if (!respuesta.Resultado || respuesta.Dato is null)
                return NotFound();

            await CargarDropdownsAsync();
            ViewBag.EsEdicion = true;
            ViewBag.EntryActual = entry;

            var serieInfo = await _series.ObtenerAsync(respuesta.Dato.Serie);
            ViewBag.NombreSerieActual = serieInfo.Resultado ? serieInfo.Dato?.NombreSerie : null;

            var dto = new FacturaCrearDTO
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
        [RequierePermiso("Facturas", Accion.Agregar)]
        public async Task<IActionResult> Crear([FromBody] FacturaCrearDTO dto)
        {
            var respuesta = await _facturas.InsertarAsync(dto);
            if (!respuesta.Resultado)
                return Json(respuesta);

            var creado = await _facturas.ObtenerAsync(respuesta.Dato);
            return Json(new { respuesta.Resultado, respuesta.Mensaje, dato = respuesta.Dato, numDoc = creado.Dato?.NumDoc });
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        [RequierePermiso("Facturas", Accion.Actualizar)]
        public async Task<IActionResult> Editar(int entry, [FromBody] FacturaCrearDTO dto)
        {
            // Cancelar un documento es una actualización, pero requiere además el permiso Eliminar.
            if (dto.Cancelado == "S" && !User.TienePermiso("Facturas", Accion.Eliminar))
                return Json(new { resultado = false, mensaje = "No tienes permiso para cancelar documentos." });

            var actual = await _facturas.ObtenerAsync(entry);
            if (!actual.Resultado || actual.Dato is null)
                return NotFound(actual);

            var actualizar = new FacturaActualizarDTO
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

            var respuesta = await _facturas.ActualizarAsync(entry, actualizar);
            return Json(respuesta);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        [RequierePermiso("Facturas", Accion.Eliminar)]
        public async Task<IActionResult> Eliminar(int entry)
        {
            var respuesta = await _facturas.EliminarAsync(entry);
            return Json(respuesta);
        }

        [HttpGet]
        [RequierePermiso("Facturas", Accion.Ver)]
        public async Task<IActionResult> ObtenerDetalle(int entry)
        {
            var respuesta = await _detalles.ObtenerPorFacturaAsync(entry);
            return Json(respuesta);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        [RequierePermiso("Facturas", Accion.Agregar)]
        public async Task<IActionResult> CrearLinea([FromBody] FacturaDetalleCrearDTO dto)
        {
            var respuesta = await _detalles.InsertarAsync(dto);
            return Json(respuesta);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        [RequierePermiso("Facturas", Accion.Actualizar)]
        public async Task<IActionResult> EditarLinea(int entry, int noLinea, [FromBody] FacturaDetalleActualizarDTO dto)
        {
            var respuesta = await _detalles.ActualizarAsync(entry, noLinea, dto);
            return Json(respuesta);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        [RequierePermiso("Facturas", Accion.Eliminar)]
        public async Task<IActionResult> EliminarLinea(int entry, int noLinea)
        {
            var respuesta = await _detalles.EliminarAsync(entry, noLinea);
            return Json(respuesta);
        }

        [HttpGet]
        [RequierePermiso("Facturas", Accion.Ver)]
        public async Task<IActionResult> BuscarSocios(string texto)
        {
            var respuesta = string.IsNullOrEmpty(texto)
                ? await _socios.ObtenerTodoAsync("C")
                : await _socios.ObtenerContenganNombreAsync(texto, "C");
            return Json(respuesta);
        }

        [HttpGet]
        [RequierePermiso("Facturas", Accion.Ver)]
        public async Task<IActionResult> BuscarArticulos(string texto)
        {
            var respuesta = string.IsNullOrEmpty(texto)
                ? await _articulos.ObtenerTodoAsync()
                : await _articulos.ObtenerContenganNombreAsync(texto);
            return Json(respuesta);
        }

        [HttpGet]
        [RequierePermiso("Facturas", Accion.Ver)]
        public async Task<IActionResult> BuscarArticulosPorCodigo(string texto)
        {
            var respuesta = string.IsNullOrEmpty(texto)
                ? await _articulos.ObtenerTodoAsync()
                : await _articulos.ObtenerContenganCodigoAsync(texto);
            return Json(respuesta);
        }

        [HttpGet]
        [RequierePermiso("Facturas", Accion.Ver)]
        public async Task<IActionResult> BuscarAlmacenes(string texto)
        {
            var respuesta = string.IsNullOrEmpty(texto)
                ? await _almacenes.ObtenerTodoAsync()
                : await _almacenes.ObtenerContenganNombreAsync(texto);
            return Json(respuesta);
        }

        [HttpGet]
        [RequierePermiso("Facturas", Accion.Ver)]
        public async Task<IActionResult> BuscarImpuestos(string texto)
        {
            var respuesta = string.IsNullOrEmpty(texto)
                ? await _impuestos.ObtenerTodoAsync()
                : await _impuestos.ObtenerContenganNombreAsync(texto);
            return Json(respuesta);
        }

        [HttpGet]
        [RequierePermiso("Facturas", Accion.Ver)]
        public async Task<IActionResult> ObtenerAlmacenPorCodigo(string codigo)
        {
            var respuesta = await _almacenes.ObtenerAsync(codigo);
            return Json(respuesta);
        }

        [HttpGet]
        [RequierePermiso("Facturas", Accion.Ver)]
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
