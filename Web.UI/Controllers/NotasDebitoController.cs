using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Rendering;
using System.Linq;
using Web.ApiClient.Clientes;
using Web.ApiClient.Dtos.NotaDebito;
using Web.UI.Authorization;

namespace Web.UI.Controllers
{
    [Authorize]
    public class NotasDebitoController : Controller
    {
        private readonly INotaDebitoApiClient _notas;
        private readonly ISocioNegocioApiClient _socios;
        private readonly IMonedaApiClient _monedas;
        private readonly IArticuloApiClient _articulos;
        private readonly IAlmacenApiClient _almacenes;
        private readonly IImpuestoApiClient _impuestos;
        private readonly INumeracionDocumentoDetApiClient _series;
        private readonly INumeracionDocumentoApiClient _numeracion;

        // ---- Constantes propias del documento (en la nota de debito de proveedor cambian estas lineas) ----
        // CodigoObj y SubTipoDoc de NumeracionDocumento que identifican a "Notas de debito de cliente":
        // la nota comparte objeto con la factura (6) y se distingue por el subtipo ND.
        private const string CodigoObjNotaDebito = "6";
        private const string SubTipoDocNotaDebito = "ND";
        private const string TipoSocio = "C";
        // ---- fin de constantes ----

        public NotasDebitoController(
            INotaDebitoApiClient notas,
            ISocioNegocioApiClient socios,
            IMonedaApiClient monedas,
            IArticuloApiClient articulos,
            IAlmacenApiClient almacenes,
            IImpuestoApiClient impuestos,
            INumeracionDocumentoDetApiClient series,
            INumeracionDocumentoApiClient numeracion)
        {
            _notas = notas;
            _socios = socios;
            _monedas = monedas;
            _articulos = articulos;
            _almacenes = almacenes;
            _impuestos = impuestos;
            _series = series;
            _numeracion = numeracion;
        }

        [RequierePermiso("NotasDebito", Accion.Ver)]
        public IActionResult Index() => View();

        [HttpGet]
        [RequierePermiso("NotasDebito", Accion.Ver)]
        public async Task<IActionResult> ObtenerTodos()
        {
            var respuesta = await _notas.ObtenerTodoAsync();
            return Json(respuesta);
        }

        [HttpGet]
        [RequierePermiso("NotasDebito", Accion.Agregar)]
        public async Task<IActionResult> FormularioCrear()
        {
            await CargarDropdownsAsync();
            var series = await _series.ObtenerPorDocumentoAsync(CodigoObjNotaDebito);
            ViewBag.SeriesNotaDebito = (series.Dato ?? []).Where(s => s.SubTipoDoc == SubTipoDocNotaDebito);

            // Serie preseleccionada: la configurada como "por defecto" para este objeto en la pantalla
            // "Numeración de documentos" (NumeracionDocumento.SerieDfct).
            var numeraciones = await _numeracion.ObtenerTodoAsync();
            var numeracionActual = (numeraciones.Dato ?? []).FirstOrDefault(n => n.CodigoObj == CodigoObjNotaDebito && n.SubTipoDoc == SubTipoDocNotaDebito);
            ViewBag.SerieDefecto = numeracionActual?.SerieDfct;

            ViewBag.EsEdicion = false;
            var hoy = DateTime.Today;
            return PartialView("_Form", new NotaDebitoCrearDTO
            {
                EstadoDoc = "A",
                TipoObjeto = CodigoObjNotaDebito,
                DocType = "S",
                FechaDoc = hoy,
                FechaEmision = hoy,
                PrctjeDesc = 0,
                BaseTipo = -1
            });
        }

        [HttpGet]
        [RequierePermiso("NotasDebito", Accion.Ver)]
        public async Task<IActionResult> FormularioEditar(int entry)
        {
            var respuesta = await _notas.ObtenerAsync(entry);
            if (!respuesta.Resultado || respuesta.Dato is null)
                return NotFound();

            await CargarDropdownsAsync();
            ViewBag.EsEdicion = true;
            ViewBag.EntryActual = entry;

            var serieInfo = await _series.ObtenerAsync(respuesta.Dato.Serie);
            ViewBag.NombreSerieActual = serieInfo.Resultado ? serieInfo.Dato?.NombreSerie : null;

            var dto = new NotaDebitoCrearDTO
            {
                NumDoc = respuesta.Dato.NumDoc,
                Serie = respuesta.Dato.Serie,
                Cancelado = respuesta.Dato.Cancelado,
                EstadoDoc = respuesta.Dato.Cancelado == "S" ? "C" : respuesta.Dato.EstadoDoc,
                TipoObjeto = respuesta.Dato.TipoObjeto,
                DocType = respuesta.Dato.DocType,
                FechaDoc = respuesta.Dato.FechaDoc,
                FechaEmision = respuesta.Dato.FechaEmision,
                CodigoSn = respuesta.Dato.CodigoSn,
                NombreSn = respuesta.Dato.NombreSn,
                Direccion = respuesta.Dato.Direccion,
                MonedaDoc = respuesta.Dato.MonedaDoc,
                BaseTipo = respuesta.Dato.BaseTipo,
                BaseEntry = respuesta.Dato.BaseEntry,
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
        [RequierePermiso("NotasDebito", Accion.Agregar)]
        public async Task<IActionResult> Crear([FromBody] NotaDebitoCrearDTO dto)
        {
            var respuesta = await _notas.InsertarAsync(dto);
            if (!respuesta.Resultado)
                return Json(respuesta);

            var creado = await _notas.ObtenerAsync(respuesta.Dato);
            return Json(new { respuesta.Resultado, respuesta.Mensaje, dato = respuesta.Dato, numDoc = creado.Dato?.NumDoc });
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        [RequierePermiso("NotasDebito", Accion.Actualizar)]
        public async Task<IActionResult> Editar(int entry, [FromBody] NotaDebitoCrearDTO dto)
        {
            // Cancelar un documento es una actualización, pero requiere además el permiso Eliminar.
            if (dto.Cancelado == "S" && !User.TienePermiso("NotasDebito", Accion.Eliminar))
                return Json(new { resultado = false, mensaje = "No tienes permiso para cancelar documentos." });

            var actual = await _notas.ObtenerAsync(entry);
            if (!actual.Resultado || actual.Dato is null)
                return NotFound(actual);

            var actualizar = new NotaDebitoActualizarDTO
            {
                NumDoc = actual.Dato.NumDoc,
                Serie = actual.Dato.Serie,
                Cancelado = dto.Cancelado,
                Comentario = dto.Comentario
            };

            var respuesta = await _notas.ActualizarAsync(entry, actualizar);
            return Json(respuesta);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        [RequierePermiso("NotasDebito", Accion.Eliminar)]
        public async Task<IActionResult> Eliminar(int entry)
        {
            var respuesta = await _notas.EliminarAsync(entry);
            return Json(respuesta);
        }

        [HttpGet]
        [RequierePermiso("NotasDebito", Accion.Ver)]
        public async Task<IActionResult> ObtenerDetalle(int entry)
        {
            var respuesta = await _notas.ObtenerLineasAsync(entry);
            return Json(respuesta);
        }

        [HttpGet]
        [RequierePermiso("NotasDebito", Accion.Ver)]
        public async Task<IActionResult> BuscarSocios(string texto)
        {
            var respuesta = string.IsNullOrEmpty(texto)
                ? await _socios.ObtenerTodoAsync(TipoSocio)
                : await _socios.ObtenerContenganNombreAsync(texto, TipoSocio);
            return Json(respuesta);
        }

        [HttpGet]
        [RequierePermiso("NotasDebito", Accion.Ver)]
        public async Task<IActionResult> BuscarArticulos(string texto)
        {
            var respuesta = string.IsNullOrEmpty(texto)
                ? await _articulos.ObtenerTodoAsync()
                : await _articulos.ObtenerContenganNombreAsync(texto);
            return Json(respuesta);
        }

        [HttpGet]
        [RequierePermiso("NotasDebito", Accion.Ver)]
        public async Task<IActionResult> BuscarArticulosPorCodigo(string texto)
        {
            var respuesta = string.IsNullOrEmpty(texto)
                ? await _articulos.ObtenerTodoAsync()
                : await _articulos.ObtenerContenganCodigoAsync(texto);
            return Json(respuesta);
        }

        [HttpGet]
        [RequierePermiso("NotasDebito", Accion.Ver)]
        public async Task<IActionResult> BuscarAlmacenes(string texto)
        {
            var respuesta = string.IsNullOrEmpty(texto)
                ? await _almacenes.ObtenerTodoAsync()
                : await _almacenes.ObtenerContenganNombreAsync(texto);
            return Json(respuesta);
        }

        [HttpGet]
        [RequierePermiso("NotasDebito", Accion.Ver)]
        public async Task<IActionResult> ObtenerAlmacenPorCodigo(string codigo)
        {
            var respuesta = await _almacenes.ObtenerAsync(codigo);
            return Json(respuesta);
        }

        [HttpGet]
        [RequierePermiso("NotasDebito", Accion.Ver)]
        public async Task<IActionResult> BuscarImpuestos(string texto)
        {
            var respuesta = string.IsNullOrEmpty(texto)
                ? await _impuestos.ObtenerTodoAsync()
                : await _impuestos.ObtenerContenganNombreAsync(texto);
            return Json(respuesta);
        }

        [HttpGet]
        [RequierePermiso("NotasDebito", Accion.Ver)]
        public async Task<IActionResult> ObtenerImpuestoPorCodigo(string codigo)
        {
            var respuesta = await _impuestos.ObtenerAsync(codigo);
            return Json(respuesta);
        }

        [HttpGet]
        [RequierePermiso("NotasDebito", Accion.Agregar)]
        public async Task<IActionResult> BuscarFacturasBase(string codigoSn)
        {
            var respuesta = await _notas.ObtenerFacturasBaseAsync(codigoSn ?? string.Empty);
            return Json(respuesta);
        }

        [HttpGet]
        [RequierePermiso("NotasDebito", Accion.Agregar)]
        public async Task<IActionResult> ObtenerFacturaBase(int entry)
        {
            var respuesta = await _notas.ObtenerFacturaBaseAsync(entry);
            return Json(respuesta);
        }

        private async Task CargarDropdownsAsync()
        {
            // Socio de negocio, Articulo, Almacen e Impuesto no se cargan como lista completa: el buscador
            // con autocompletado los consulta bajo demanda. Moneda es un <select> normal.
            var monedas = await _monedas.ObtenerTodoAsync();
            ViewBag.Monedas = new SelectList(monedas.Dato ?? [], "Codigo", "Nombre");
        }
    }
}
