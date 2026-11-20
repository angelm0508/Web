using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.AspNetCore.Mvc.ViewEngines;
using Microsoft.AspNetCore.Mvc.ViewFeatures;
using Web.ApiClient.Clientes;
using Web.ApiClient.Dtos;
using Web.ApiClient.Dtos.Pos;
using Web.UI.Authorization;
using Web.UI.Models;

namespace Web.UI.Controllers
{
    /// <summary>
    /// Pantalla del punto de venta y sus proxys JSON hacia <c>api/Pos</c>. Las respuestas JSON son siempre
    /// <c>{ resultado, mensaje, dato }</c>: ante un error de la API se devuelve su <c>Respuesta</c> tal cual.
    /// </summary>
    [Authorize]
    public class PosController : Controller
    {
        private const int LongitudMinimaBusqueda = 2;
        private const string VistaTicket = "_Ticket";

        private readonly IPosApiClient _pos;
        private readonly ICompositeViewEngine _motorVistas;

        public PosController(IPosApiClient pos, ICompositeViewEngine motorVistas)
        {
            _pos = pos;
            _motorVistas = motorVistas;
        }

        /// <summary>
        /// Pantalla del POS. Todo sale de <c>api/Pos/Contexto</c> (permiso <c>Pos.Ver</c>): el cajero no necesita permisos de
        /// formas de pago, impuestos ni socios de negocio.
        /// </summary>
        [RequierePermiso("Pos", Accion.Ver)]
        public async Task<IActionResult> Index()
        {
            var modelo = new PosPantallaModelo
            {
                PuedeCobrar = User.TienePermiso("Pos", Accion.Agregar),
                PuedeConfigurar = User.TienePermiso("PosConfiguracion", Accion.Ver)
            };

            var respuesta = await _pos.ObtenerContextoAsync();
            if (!respuesta.Resultado || respuesta.Dato is null)
            {
                modelo.ErrorCarga = string.IsNullOrWhiteSpace(respuesta.Mensaje) ? "No se pudo leer la configuración del POS." : respuesta.Mensaje;
                return View(modelo);
            }

            var contexto = respuesta.Dato;
            var vista = contexto.Configuracion ?? new PosConfiguracionVista();
            modelo.Faltantes = vista.Faltantes ?? new List<string>();
            var config = vista.Configuracion ?? new PosConfiguracionDato();
            modelo.CodigoImpuesto = config.CodigoImpuesto;
            modelo.FormaPagoEfectivo = config.FormaPagoEfectivo;
            modelo.Moneda = config.MonedaDoc;
            if (modelo.Faltantes.Count > 0)
                return View(modelo);

            // Formas de pago activas (la API ya las filtra), con la de efectivo de la configuración primero.
            modelo.FormasPago = (contexto.FormasPago ?? [])
                .OrderBy(f => string.Equals(f.Codigo, config.FormaPagoEfectivo, StringComparison.OrdinalIgnoreCase) ? 0 : 1)
                .ThenBy(f => f.Codigo, StringComparer.Ordinal)
                .ToList();
            if (!modelo.FormasPago.Any(f => string.Equals(f.Codigo, config.FormaPagoEfectivo, StringComparison.OrdinalIgnoreCase)))
                modelo.Faltantes.Add("La forma de pago en efectivo de la configuración no está activa.");

            // Tasa del impuesto: solo para el total estimado que se muestra antes de cobrar.
            modelo.TasaImpuesto = contexto.TasaImpuesto;
            modelo.TasaDisponible = !string.IsNullOrEmpty(config.CodigoImpuesto);

            // Cliente por defecto: nombre y NIT para mostrarlos (si no existe, se muestra el código).
            modelo.ClienteCodigo = config.ClienteDefecto ?? string.Empty;
            modelo.ClienteNombre = string.IsNullOrWhiteSpace(contexto.NombreCliente) ? modelo.ClienteCodigo : contexto.NombreCliente;
            modelo.ClienteNit = contexto.NitCliente?.Trim() ?? string.Empty;

            return View(modelo);
        }

        /// <summary>Sugerencias del buscador (código, código de barras o nombre; mínimo 2 caracteres) con el precio del cliente.</summary>
        [HttpGet]
        [RequierePermiso("Pos", Accion.Ver)]
        public async Task<IActionResult> Buscar(string? texto, string? cliente)
        {
            if (string.IsNullOrWhiteSpace(texto) || texto.Trim().Length < LongitudMinimaBusqueda)
                return Json(new Respuesta<List<ArticuloPos>> { Resultado = true, Dato = new List<ArticuloPos>() });

            return Json(await _pos.BuscarArticulosAsync(texto.Trim(), cliente));
        }

        /// <summary>Coincidencia exacta (lector de códigos): código de barras o código del artículo.</summary>
        [HttpGet]
        [RequierePermiso("Pos", Accion.Ver)]
        public async Task<IActionResult> PorCodigo(string? codigo, string? cliente)
        {
            if (string.IsNullOrWhiteSpace(codigo))
                return Json(new Respuesta<ArticuloPos> { Resultado = false, Mensaje = "Indica el código del artículo." });

            return Json(await _pos.ObtenerArticuloPorCodigoAsync(codigo.Trim(), cliente));
        }

        [HttpGet]
        [RequierePermiso("Pos", Accion.Ver)]
        public async Task<IActionResult> Rapidos() => Json(await _pos.ObtenerRapidosAsync());

        /// <summary>
        /// Clientes para «Cambiar cliente»: la API (<c>api/Pos/Clientes</c>, permiso <c>Pos.Ver</c>) devuelve hasta 10 clientes
        /// activos cuyo código o nombre contengan el texto (mínimo 2 caracteres); el precio por cliente lo resuelve la API.
        /// </summary>
        [HttpGet]
        [RequierePermiso("Pos", Accion.Ver)]
        public async Task<IActionResult> Clientes(string? texto)
        {
            var filtro = texto?.Trim() ?? string.Empty;
            if (filtro.Length < LongitudMinimaBusqueda)
                return Json(new { resultado = true, mensaje = string.Empty, dato = new List<object>() });

            var respuesta = await _pos.BuscarClientesAsync(filtro);
            if (!respuesta.Resultado)
                return Json(respuesta);

            var clientes = (respuesta.Dato ?? [])
                .Select(s => new { codigo = s.Codigo, nombre = string.IsNullOrWhiteSpace(s.Nombre) ? s.Codigo : s.Nombre, nit = s.Nit?.Trim() ?? string.Empty })
                .ToList();
            return Json(new { resultado = true, mensaje = respuesta.Mensaje, dato = clientes });
        }

        /// <summary>
        /// Cobra la venta (la API fija precios, impuesto y totales; el cajero sale del token). Si la venta se registró, además
        /// del ticket se devuelve su HTML (<c>html</c>) para mostrarlo; si no se pudo armar el HTML, <c>html</c> va nulo y la
        /// pantalla lo pide a <c>Ticket</c>: la venta NUNCA se informa como fallida cuando la API la confirmó.
        /// </summary>
        [HttpPost]
        [ValidateAntiForgeryToken]
        [RequierePermiso("Pos", Accion.Agregar)]
        public async Task<IActionResult> Vender([FromBody] VentaPosSolicitud? solicitud)
        {
            if (solicitud is null)
                return Json(new { resultado = false, mensaje = "La venta es obligatoria.", dato = (TicketPos?)null, incierto = false });

            var respuesta = await _pos.VenderAsync(solicitud);
            if (!respuesta.Resultado || respuesta.Dato is null)
                return Json(new { resultado = false, mensaje = respuesta.Mensaje, dato = (TicketPos?)null, incierto = EsResultadoIncierto(respuesta) });

            string? html = null;
            try
            {
                html = await RenderizarParcialAsync(VistaTicket, respuesta.Dato, reimpresion: false);
            }
            catch (Exception)
            {
                // La venta ya existe: sin HTML la pantalla carga el ticket con GET Ticket.
            }

            return Json(new { resultado = true, mensaje = respuesta.Mensaje, dato = respuesta.Dato, html });
        }

        /// <summary>Reimpresión del ticket: devuelve el parcial <c>_Ticket</c>, o el <c>Respuesta</c> JSON si la API falla.</summary>
        [HttpGet]
        [RequierePermiso("Pos", Accion.Ver)]
        public async Task<IActionResult> Ticket(int factura)
        {
            var respuesta = await _pos.ObtenerTicketAsync(factura);
            if (!respuesta.Resultado || respuesta.Dato is null)
                return Json(respuesta);

            ViewData["Reimpresion"] = true;
            return PartialView(VistaTicket, respuesta.Dato);
        }

        [HttpGet]
        [RequierePermiso("Pos", Accion.Ver)]
        public async Task<IActionResult> VentasDelDia() => Json(await _pos.ObtenerVentasDelDiaAsync());

        /// <summary>
        /// Venta fallida cuyo resultado real no se conoce: <c>ApiClientBase</c> no llegó a leer una respuesta de negocio de
        /// la API (excepción de red o tiempo de espera, cuerpo vacío o ilegible, 401/403). En esos casos la venta pudo
        /// registrarse y la pantalla pide revisar «Ventas del día». Un rechazo de negocio (400 con mensaje) sí es seguro.
        /// </summary>
        private static bool EsResultadoIncierto(Respuesta<TicketPos> respuesta)
        {
            if (respuesta.Resultado && respuesta.Dato is null)
                return true;   // la API dijo que sí pero no devolvió el ticket
            var mensaje = respuesta.Mensaje ?? string.Empty;
            return string.IsNullOrWhiteSpace(mensaje)
                || mensaje.StartsWith("No se pudo conectar con la API", StringComparison.Ordinal)
                || mensaje.StartsWith("La API devolvió una respuesta vacía", StringComparison.Ordinal)
                || mensaje.StartsWith("Tu sesión expiró", StringComparison.Ordinal);
        }

        private async Task<string> RenderizarParcialAsync(string nombreVista, object modelo, bool reimpresion)
        {
            var busqueda = _motorVistas.FindView(ControllerContext, nombreVista, isMainPage: false);
            if (!busqueda.Success)
                throw new InvalidOperationException($"No se encontró la vista {nombreVista}.");

            var datos = new ViewDataDictionary(ViewData) { Model = modelo };
            datos["Reimpresion"] = reimpresion;
            await using var escritor = new StringWriter();
            var contexto = new ViewContext(ControllerContext, busqueda.View, datos, TempData, escritor, new HtmlHelperOptions());
            await busqueda.View.RenderAsync(contexto);
            return escritor.ToString();
        }
    }
}
