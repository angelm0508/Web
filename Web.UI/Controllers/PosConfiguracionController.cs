using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Rendering;
using Web.ApiClient.Clientes;
using Web.ApiClient.Dtos;
using Web.ApiClient.Dtos.NumeracionDocumentoDet;
using Web.ApiClient.Dtos.Pos;
using Web.UI.Authorization;

namespace Web.UI.Controllers
{
    /// <summary>Pantalla «Configuración POS»: series, almacén, impuesto, moneda, cliente y forma de pago en efectivo del punto de venta.</summary>
    [Authorize]
    public class PosConfiguracionController : Controller
    {
        // CodigoObj de NumeracionDocumento: 6 = Factura, 24 = Pago recibido.
        private const string CodigoObjFactura = "6";
        private const string CodigoObjPagoRecibido = "24";
        private const string SubTipoDocFactura = "--";

        private readonly IPosApiClient _pos;
        private readonly INumeracionDocumentoDetApiClient _series;
        private readonly IAlmacenApiClient _almacenes;
        private readonly IImpuestoApiClient _impuestos;
        private readonly IMonedaApiClient _monedas;
        private readonly IFormaPagoApiClient _formasPago;
        private readonly ISocioNegocioApiClient _socios;

        public PosConfiguracionController(
            IPosApiClient pos,
            INumeracionDocumentoDetApiClient series,
            IAlmacenApiClient almacenes,
            IImpuestoApiClient impuestos,
            IMonedaApiClient monedas,
            IFormaPagoApiClient formasPago,
            ISocioNegocioApiClient socios)
        {
            _pos = pos;
            _series = series;
            _almacenes = almacenes;
            _impuestos = impuestos;
            _monedas = monedas;
            _formasPago = formasPago;
            _socios = socios;
        }

        [RequierePermiso("PosConfiguracion", Accion.Ver)]
        public async Task<IActionResult> Index()
        {
            var respuesta = await _pos.ObtenerConfiguracionAsync();
            var cargada = respuesta.Resultado && respuesta.Dato is not null;
            var vista = cargada ? respuesta.Dato! : new PosConfiguracionVista();
            // Sin la configuración actual la pantalla es de solo lectura y no tiene «Guardar»: un PUT con los campos
            // vacíos sobrescribiría la configuración real.
            ViewBag.ErrorCarga = cargada
                ? null
                : (string.IsNullOrWhiteSpace(respuesta.Mensaje) ? "La API no devolvió la configuración del POS." : respuesta.Mensaje);
            ViewBag.PuedeActualizar = cargada && User.TienePermiso("PosConfiguracion", Accion.Actualizar);

            var config = vista.Configuracion;

            // Series de factura del POS: automáticas (no manuales), del subtipo "--" y no bloqueadas.
            var seriesFactura = await _series.ObtenerPorDocumentoAsync(CodigoObjFactura);
            ViewBag.SeriesFactura = ConValorActual(
                (seriesFactura.Dato ?? [])
                    .Where(s => s.SubTipoDoc == SubTipoDocFactura && s.Manual != "S" && s.Bloqueado != "S")
                    .OrderBy(s => s.Serie)
                    .Select(s => (s.Serie.ToString(), s.NombreSerie)),
                config.SerieFactura?.ToString(),
                TextoSerie(seriesFactura.Dato, config.SerieFactura),
                seriesFactura.Resultado);

            // Series de pagos recibidos: automáticas y no bloqueadas.
            var seriesPago = await _series.ObtenerPorDocumentoAsync(CodigoObjPagoRecibido);
            ViewBag.SeriesPago = ConValorActual(
                (seriesPago.Dato ?? [])
                    .Where(s => s.Manual != "S" && s.Bloqueado != "S")
                    .OrderBy(s => s.Serie)
                    .Select(s => (s.Serie.ToString(), s.NombreSerie)),
                config.SeriePago?.ToString(),
                TextoSerie(seriesPago.Dato, config.SeriePago),
                seriesPago.Resultado);

            var almacenes = await _almacenes.ObtenerTodoAsync();
            ViewBag.Almacenes = ConValorActual(
                (almacenes.Dato ?? []).Where(a => a.Activo == "S" && a.Bloqueado != "S").OrderBy(a => a.Codigo, StringComparer.Ordinal)
                    .Select(a => (a.Codigo, $"{a.Codigo} - {a.Nombre}")),
                config.CodAlmacen,
                (almacenes.Dato ?? []).Where(a => a.Codigo == config.CodAlmacen).Select(a => $"{a.Codigo} - {a.Nombre}").FirstOrDefault() ?? config.CodAlmacen,
                almacenes.Resultado);

            var impuestos = await _impuestos.ObtenerTodoAsync();
            ViewBag.Impuestos = ConValorActual(
                (impuestos.Dato ?? []).OrderBy(i => i.Codigo, StringComparer.Ordinal)
                    .Select(i => (i.Codigo, $"{i.Codigo} - {i.Nombre}")),
                config.CodigoImpuesto, config.CodigoImpuesto, impuestos.Resultado);

            var monedas = await _monedas.ObtenerTodoAsync();
            ViewBag.Monedas = ConValorActual(
                (monedas.Dato ?? []).OrderBy(m => m.Codigo, StringComparer.Ordinal)
                    .Select(m => (m.Codigo, $"{m.Codigo} - {m.Nombre}")),
                config.MonedaDoc, config.MonedaDoc, monedas.Resultado);

            var formas = await _formasPago.ObtenerTodoAsync();
            ViewBag.FormasPago = ConValorActual(
                (formas.Dato ?? []).Where(f => f.Activo == "S").OrderBy(f => f.Codigo, StringComparer.Ordinal)
                    .Select(f => (f.Codigo, $"{f.Codigo} - {f.Nombre}")),
                config.FormaPagoEfectivo,
                (formas.Dato ?? []).Where(f => f.Codigo == config.FormaPagoEfectivo).Select(f => $"{f.Codigo} - {f.Nombre}").FirstOrDefault() ?? config.FormaPagoEfectivo,
                formas.Resultado);

            // Texto del cliente por defecto («código - nombre»); si no se puede leer, se muestra el código.
            string? textoCliente = null;
            if (!string.IsNullOrEmpty(config.ClienteDefecto))
            {
                var cliente = await _socios.ObtenerAsync(config.ClienteDefecto);
                textoCliente = cliente.Resultado && cliente.Dato is not null
                    ? $"{cliente.Dato.Codigo} - {cliente.Dato.Nombre}"
                    : config.ClienteDefecto;
            }
            ViewBag.TextoCliente = textoCliente;

            return View(vista);
        }

        /// <summary>Buscador de clientes del cliente por defecto (solo socios de tipo cliente).</summary>
        [HttpGet]
        [RequierePermiso("PosConfiguracion", Accion.Ver)]
        public async Task<IActionResult> BuscarClientes(string texto)
        {
            var respuesta = string.IsNullOrEmpty(texto)
                ? await _socios.ObtenerTodoAsync("C")
                : await _socios.ObtenerContenganNombreAsync(texto, "C");
            return Json(respuesta);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        [RequierePermiso("PosConfiguracion", Accion.Actualizar)]
        public async Task<IActionResult> Guardar([FromBody] PosConfiguracionDato dato)
        {
            if (dato is null)
                return Json(new Respuesta<PosConfiguracionVista> { Resultado = false, Mensaje = "La configuración del POS es obligatoria." });

            var respuesta = await _pos.GuardarConfiguracionAsync(dato);
            return Json(respuesta);
        }

        /// <summary>
        /// Opciones de un select. Si el valor guardado ya no está entre las opciones vigentes (serie bloqueada, forma de pago
        /// desactivada...) se agrega igualmente para que la pantalla no lo borre en silencio al guardar, con la nota
        /// «(ya no disponible)». Si el catálogo no se pudo cargar no se sabe si sigue disponible: se agrega sin la nota.
        /// </summary>
        private static List<SelectListItem> ConValorActual(
            IEnumerable<(string Valor, string Texto)> opciones, string? valorActual, string? textoActual, bool catalogoCargado)
        {
            var lista = opciones.Select(o => new SelectListItem(o.Texto, o.Valor)).ToList();
            if (!string.IsNullOrEmpty(valorActual) && lista.All(o => o.Value != valorActual))
            {
                var texto = string.IsNullOrWhiteSpace(textoActual) ? valorActual : textoActual;
                lista.Insert(0, new SelectListItem(catalogoCargado ? $"{texto} (ya no disponible)" : texto, valorActual));
            }
            return lista;
        }

        /// <summary>Texto de una serie guardada: su nombre en el catálogo completo (aunque esté bloqueada) o, si no está, el número.</summary>
        private static string? TextoSerie(IEnumerable<NumeracionDocumentoDetDTO>? catalogo, int? serie)
        {
            if (serie is null)
                return null;
            var nombre = (catalogo ?? []).Where(s => s.Serie == serie).Select(s => s.NombreSerie).FirstOrDefault();
            return string.IsNullOrWhiteSpace(nombre) ? serie.ToString() : $"{nombre} ({serie})";
        }
    }
}
