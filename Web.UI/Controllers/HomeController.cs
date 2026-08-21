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
        private readonly IAlmacenApiClient _almacenes;
        private readonly ISocioNegocioApiClient _sociosNegocio;
        private readonly IDireccionSocioNegocioApiClient _direcciones;

        public HomeController(
            IArticuloApiClient articulos,
            IAlmacenApiClient almacenes,
            ISocioNegocioApiClient sociosNegocio,
            IDireccionSocioNegocioApiClient direcciones)
        {
            _articulos = articulos;
            _almacenes = almacenes;
            _sociosNegocio = sociosNegocio;
            _direcciones = direcciones;
        }

        public async Task<IActionResult> Index()
        {
            var articulos = await _articulos.ObtenerTodoAsync();
            var almacenes = await _almacenes.ObtenerTodoAsync();
            var sociosNegocio = await _sociosNegocio.ObtenerTodoAsync();
            var direcciones = await _direcciones.ObtenerTodoAsync();

            var modelo = new DashboardViewModel
            {
                TotalArticulos = articulos.Dato?.Count() ?? 0,
                TotalAlmacenes = almacenes.Dato?.Count() ?? 0,
                TotalSociosNegocio = sociosNegocio.Dato?.Count() ?? 0,
                TotalDireccionesSocioNegocio = direcciones.Dato?.Count() ?? 0
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
