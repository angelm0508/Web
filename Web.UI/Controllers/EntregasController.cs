using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Rendering;
using System.Linq;
using Web.ApiClient.Clientes;
using Web.ApiClient.Dtos.DocumentoBase;
using Web.ApiClient.Dtos.Entrega;
using Web.ApiClient.Dtos.EntregaDetalle;
using Web.UI.Authorization;

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
        private readonly INumeracionDocumentoApiClient _numeracion;
        private readonly IDocumentoBaseApiClient _documentoBase;

        // Tipo de objeto de Entrega (destino de "Copiar a").
        private const int TipoDestinoEntrega = 5;

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
            INumeracionDocumentoDetApiClient series,
            INumeracionDocumentoApiClient numeracion,
            IDocumentoBaseApiClient documentoBase)
        {
            _entregas = entregas;
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

        [RequierePermiso("Entregas", Accion.Ver)]
        public IActionResult Index() => View();

        [HttpGet]
        [RequierePermiso("Entregas", Accion.Ver)]
        public async Task<IActionResult> ObtenerTodos()
        {
            var respuesta = await _entregas.ObtenerTodoAsync();
            return Json(respuesta);
        }

        [HttpGet]
        [RequierePermiso("Entregas", Accion.Agregar)]
        public async Task<IActionResult> FormularioCrear(int? baseTipo = null, int? baseEntry = null)
        {
            // "Copiar a": el borrador trae la cabecera y las líneas abiertas del documento origen.
            DocumentoBaseBorradorDTO? borrador = null;
            if (baseTipo.HasValue && baseEntry.HasValue)
            {
                var copia = await _documentoBase.ObtenerBorradorAsync(baseTipo.Value, baseEntry.Value, TipoDestinoEntrega);
                if (!copia.Resultado || copia.Dato is null)
                    return BadRequest(copia.Mensaje);   // el JS lo muestra con App.mostrarError
                borrador = copia.Dato;
            }
            ViewBag.Borrador = borrador;

            await CargarDropdownsAsync();
            var series = await _series.ObtenerPorDocumentoAsync(CodigoObjEntrega);
            ViewBag.SeriesEntrega = (series.Dato ?? []).Where(s => s.SubTipoDoc == SubTipoDocEntrega);

            // Serie preseleccionada: la que está configurada como "por defecto" para este objeto en
            // la pantalla "Numeración de documentos" (NumeracionDocumento.SerieDfct).
            var numeraciones = await _numeracion.ObtenerTodoAsync();
            var numeracionActual = (numeraciones.Dato ?? []).FirstOrDefault(n => n.CodigoObj == CodigoObjEntrega && n.SubTipoDoc == SubTipoDocEntrega);
            ViewBag.SerieDefecto = numeracionActual?.SerieDfct;

            ViewBag.EsEdicion = false;
            var dto = new EntregaCrearDTO { EstadoDoc = "A", TipoObjeto = "5" };
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
        [RequierePermiso("Entregas", Accion.Ver)]
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
        [RequierePermiso("Entregas", Accion.Agregar)]
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
        [RequierePermiso("Entregas", Accion.Actualizar)]
        public async Task<IActionResult> Editar(int entry, [FromBody] EntregaCrearDTO dto)
        {
            // Cancelar un documento es una actualización, pero requiere además el permiso Eliminar.
            if (dto.Cancelado == "S" && !User.TienePermiso("Entregas", Accion.Eliminar))
                return Json(new { resultado = false, mensaje = "No tienes permiso para cancelar documentos." });

            var actual = await _entregas.ObtenerAsync(entry);
            if (!actual.Resultado || actual.Dato is null)
                return NotFound(actual);

            var actualizar = new EntregaActualizarDTO
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

            var respuesta = await _entregas.ActualizarAsync(entry, actualizar);
            return Json(respuesta);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        [RequierePermiso("Entregas", Accion.Eliminar)]
        public async Task<IActionResult> Eliminar(int entry)
        {
            var respuesta = await _entregas.EliminarAsync(entry);
            return Json(respuesta);
        }

        [HttpGet]
        [RequierePermiso("Entregas", Accion.Ver)]
        public async Task<IActionResult> ObtenerDetalle(int entry)
        {
            var respuesta = await _detalles.ObtenerPorEntregaAsync(entry);
            return Json(respuesta);
        }

        [HttpGet]
        [RequierePermiso("Entregas", Accion.Ver)]
        public async Task<IActionResult> BuscarSocios(string texto)
        {
            var respuesta = string.IsNullOrEmpty(texto)
                ? await _socios.ObtenerTodoAsync("C")
                : await _socios.ObtenerContenganNombreAsync(texto, "C");
            return Json(respuesta);
        }

        [HttpGet]
        [RequierePermiso("Entregas", Accion.Ver)]
        public async Task<IActionResult> BuscarArticulos(string texto)
        {
            var respuesta = string.IsNullOrEmpty(texto)
                ? await _articulos.ObtenerTodoAsync()
                : await _articulos.ObtenerContenganNombreAsync(texto);
            return Json(respuesta);
        }

        [HttpGet]
        [RequierePermiso("Entregas", Accion.Ver)]
        public async Task<IActionResult> BuscarArticulosPorCodigo(string texto)
        {
            var respuesta = string.IsNullOrEmpty(texto)
                ? await _articulos.ObtenerTodoAsync()
                : await _articulos.ObtenerContenganCodigoAsync(texto);
            return Json(respuesta);
        }

        [HttpGet]
        [RequierePermiso("Entregas", Accion.Ver)]
        public async Task<IActionResult> BuscarAlmacenes(string texto)
        {
            var respuesta = string.IsNullOrEmpty(texto)
                ? await _almacenes.ObtenerTodoAsync()
                : await _almacenes.ObtenerContenganNombreAsync(texto);
            return Json(respuesta);
        }

        [HttpGet]
        [RequierePermiso("Entregas", Accion.Ver)]
        public async Task<IActionResult> BuscarImpuestos(string texto)
        {
            var respuesta = string.IsNullOrEmpty(texto)
                ? await _impuestos.ObtenerTodoAsync()
                : await _impuestos.ObtenerContenganNombreAsync(texto);
            return Json(respuesta);
        }

        [HttpGet]
        [RequierePermiso("Entregas", Accion.Ver)]
        public async Task<IActionResult> ObtenerAlmacenPorCodigo(string codigo)
        {
            var respuesta = await _almacenes.ObtenerAsync(codigo);
            return Json(respuesta);
        }

        [HttpGet]
        [RequierePermiso("Entregas", Accion.Ver)]
        public async Task<IActionResult> ObtenerImpuestoPorCodigo(string codigo)
        {
            var respuesta = await _impuestos.ObtenerAsync(codigo);
            return Json(respuesta);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        [RequierePermiso("Entregas", Accion.Agregar)]
        public async Task<IActionResult> CrearLinea([FromBody] EntregaDetalleCrearDTO dto)
        {
            var respuesta = await _detalles.InsertarAsync(dto);
            return Json(respuesta);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        [RequierePermiso("Entregas", Accion.Actualizar)]
        public async Task<IActionResult> EditarLinea(int entry, int noLinea, [FromBody] EntregaDetalleActualizarDTO dto)
        {
            var respuesta = await _detalles.ActualizarAsync(entry, noLinea, dto);
            return Json(respuesta);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        [RequierePermiso("Entregas", Accion.Eliminar)]
        public async Task<IActionResult> EliminarLinea(int entry, int noLinea)
        {
            var respuesta = await _detalles.EliminarAsync(entry, noLinea);
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
