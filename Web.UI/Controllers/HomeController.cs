using System.Diagnostics;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Web.ApiClient.Clientes;
using Web.UI.Models;
using Web.UI.Models.Home;

namespace Web.UI.Controllers
{
    [Authorize]
    public class HomeController : Controller
    {
        private readonly IArticuloApiClient _articulos;
        private readonly ISocioNegocioApiClient _sociosNegocio;
        private readonly ICotizacionApiClient _cotizaciones;

        public HomeController(
            IArticuloApiClient articulos,
            ISocioNegocioApiClient sociosNegocio,
            ICotizacionApiClient cotizaciones)
        {
            _articulos = articulos;
            _sociosNegocio = sociosNegocio;
            _cotizaciones = cotizaciones;
        }

        public async Task<IActionResult> Index()
        {
            var articulos = await _articulos.ObtenerTodoAsync();
            var sociosNegocio = await _sociosNegocio.ObtenerTodoAsync();
            var cotizaciones = await _cotizaciones.ObtenerTodoAsync();

            var listaArticulos = (articulos.Dato ?? Enumerable.Empty<Web.ApiClient.Dtos.Articulo.ArticuloDTO>()).ToList();
            var listaCotizaciones = (cotizaciones.Dato ?? Enumerable.Empty<Web.ApiClient.Dtos.Cotizacion.CotizacionDTO>()).ToList();

            // Stock bajo: artículos con mínimo configurado (> 0) cuya cantidad disponible no lo alcanza.
            var articulosStockBajo = listaArticulos
                .Where(a => a.Minimo is > 0 && (a.CantDisponible ?? 0) < a.Minimo.Value)
                .Select(a => new ArticuloStockBajoViewModel
                {
                    Codigo = a.Codigo,
                    Nombre = a.Nombre,
                    CantDisponible = a.CantDisponible,
                    Minimo = a.Minimo
                })
                .ToList();

            // Top artículos por precio unitario (sustituto real de "top productos del mes" -- no
            // hay historial de ventas todavía para calcular el original).
            var topPrecio = listaArticulos
                .Where(a => a.PrecioUnitario is > 0)
                .OrderByDescending(a => a.PrecioUnitario)
                .Take(5)
                .ToList();
            var precioMaximo = topPrecio.Count > 0 ? topPrecio[0].PrecioUnitario!.Value : 0;
            var topArticulos = topPrecio
                .Select(a => new ArticuloTopViewModel
                {
                    Nombre = a.Nombre ?? a.Codigo,
                    Precio = a.PrecioUnitario!.Value,
                    PorcentajeBarra = precioMaximo > 0 ? (int)Math.Round(a.PrecioUnitario!.Value / precioMaximo * 100) : 0
                })
                .ToList();

            var ultimasCotizaciones = listaCotizaciones
                .OrderByDescending(c => c.Entry)
                .Take(5)
                .Select(c => new TransaccionRecienteViewModel
                {
                    NumDoc = c.NumDoc,
                    NombreSn = c.NombreSn ?? c.CodigoSn,
                    Estado = c.EstadoDoc,
                    Total = c.TotalDoc
                })
                .ToList();

            var modelo = new DashboardViewModel
            {
                NombreUsuario = User.Identity?.Name ?? string.Empty,
                TotalArticulos = listaArticulos.Count,
                TotalSociosNegocio = sociosNegocio.Dato?.Count() ?? 0,
                TotalCotizaciones = listaCotizaciones.Count,
                TotalArticulosStockBajo = articulosStockBajo.Count,
                TopArticulosPorPrecio = topArticulos,
                UltimasCotizaciones = ultimasCotizaciones,
                ArticulosStockBajo = articulosStockBajo
            };

            return View(modelo);
        }

        [AllowAnonymous]
        [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
        public IActionResult Error()
        {
            return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
        }
    }
}
