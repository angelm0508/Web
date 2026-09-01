using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Linq;
using Web.ApiClient.Clientes;
using Web.ApiClient.Dtos.SalidaMercancia;

namespace Web.UI.Controllers
{
    [Authorize]
    public class SalidasMercanciaController : Controller
    {
        private readonly ISalidaMercanciaApiClient _salidasMercancia;
        private readonly ISalidaMercanciaDetalleApiClient _detalles;
        private readonly IArticuloApiClient _articulos;
        private readonly IAlmacenApiClient _almacenes;
        private readonly INumeracionDocumentoDetApiClient _series;
        private readonly INumeracionDocumentoApiClient _numeracion;

        // CodigoObj de NumeracionDocumento que identifica a "Salidas de mercancía" como tipo de objeto.
        private const string CodigoObjSalidaMercancia = "60";
        private const string SubTipoDocSalidaMercancia = "--";

        public SalidasMercanciaController(
            ISalidaMercanciaApiClient salidasMercancia,
            ISalidaMercanciaDetalleApiClient detalles,
            IArticuloApiClient articulos,
            IAlmacenApiClient almacenes,
            INumeracionDocumentoDetApiClient series,
            INumeracionDocumentoApiClient numeracion)
        {
            _salidasMercancia = salidasMercancia;
            _detalles = detalles;
            _articulos = articulos;
            _almacenes = almacenes;
            _series = series;
            _numeracion = numeracion;
        }

        public IActionResult Index() => View();

        [HttpGet]
        public async Task<IActionResult> ObtenerTodos()
        {
            var respuesta = await _salidasMercancia.ObtenerTodoAsync();
            return Json(respuesta);
        }

        [HttpGet]
        public async Task<IActionResult> FormularioCrear()
        {
            var series = await _series.ObtenerPorDocumentoAsync(CodigoObjSalidaMercancia);
            ViewBag.SeriesSalidaMercancia = (series.Dato ?? []).Where(s => s.SubTipoDoc == SubTipoDocSalidaMercancia);

            // Serie preseleccionada: la que está configurada como "por defecto" para este objeto en
            // la pantalla "Numeración de documentos" (NumeracionDocumento.SerieDfct).
            var numeraciones = await _numeracion.ObtenerTodoAsync();
            var numeracionActual = (numeraciones.Dato ?? []).FirstOrDefault(n => n.CodigoObj == CodigoObjSalidaMercancia && n.SubTipoDoc == SubTipoDocSalidaMercancia);
            ViewBag.SerieDefecto = numeracionActual?.SerieDfct;

            ViewBag.EsEdicion = false;
            return PartialView("_Form", new SalidaMercanciaCrearDTO());
        }

        [HttpGet]
        public async Task<IActionResult> FormularioEditar(int entry)
        {
            var respuesta = await _salidasMercancia.ObtenerAsync(entry);
            if (!respuesta.Resultado || respuesta.Dato is null)
                return NotFound();

            ViewBag.EsEdicion = true;
            ViewBag.EntryActual = entry;

            var serieInfo = await _series.ObtenerAsync(respuesta.Dato.Serie);
            ViewBag.NombreSerieActual = serieInfo.Resultado ? serieInfo.Dato?.NombreSerie : null;

            var dto = new SalidaMercanciaCrearDTO
            {
                NumDoc = respuesta.Dato.NumDoc,
                Serie = respuesta.Dato.Serie,
                NumManual = respuesta.Dato.NumManual,
                FechaDoc = respuesta.Dato.FechaDoc,
                FechaContab = respuesta.Dato.FechaContab,
                Referencia = respuesta.Dato.Referencia,
                Comentario = respuesta.Dato.Comentario,
                Cancelado = respuesta.Dato.Cancelado
            };

            return PartialView("_Form", dto);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Crear([FromBody] SalidaMercanciaCrearDTO dto)
        {
            var respuesta = await _salidasMercancia.InsertarAsync(dto);
            if (!respuesta.Resultado)
                return Json(respuesta);

            var creado = await _salidasMercancia.ObtenerAsync(respuesta.Dato);
            return Json(new { respuesta.Resultado, respuesta.Mensaje, dato = respuesta.Dato, numDoc = creado.Dato?.NumDoc });
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Editar(int entry, [FromBody] SalidaMercanciaCrearDTO dto)
        {
            var actual = await _salidasMercancia.ObtenerAsync(entry);
            if (!actual.Resultado || actual.Dato is null)
                return NotFound(actual);

            // El dominio de la API solo reacciona a Comentario y Cancelado; el resto del
            // encabezado se reenvía tal cual está persistido para no perderlo en el PUT.
            var actualizar = new SalidaMercanciaActualizarDTO
            {
                NumDoc = actual.Dato.NumDoc,
                Serie = actual.Dato.Serie,
                NumManual = actual.Dato.NumManual,
                FechaDoc = actual.Dato.FechaDoc,
                FechaContab = actual.Dato.FechaContab,
                Referencia = actual.Dato.Referencia,
                Comentario = dto.Comentario,
                Cancelado = dto.Cancelado
            };

            var respuesta = await _salidasMercancia.ActualizarAsync(entry, actualizar);
            return Json(respuesta);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Eliminar(int entry)
        {
            var respuesta = await _salidasMercancia.EliminarAsync(entry);
            return Json(respuesta);
        }

        [HttpGet]
        public async Task<IActionResult> ObtenerDetalle(int entry)
        {
            var respuesta = await _detalles.ObtenerPorSalidaMercanciaAsync(entry);
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
        public async Task<IActionResult> BuscarAlmacenes(string texto)
        {
            var respuesta = string.IsNullOrEmpty(texto)
                ? await _almacenes.ObtenerTodoAsync()
                : await _almacenes.ObtenerContenganNombreAsync(texto);
            return Json(respuesta);
        }

        [HttpGet]
        public async Task<IActionResult> ObtenerAlmacenPorCodigo(string codigo)
        {
            var respuesta = await _almacenes.ObtenerAsync(codigo);
            return Json(respuesta);
        }
    }
}
