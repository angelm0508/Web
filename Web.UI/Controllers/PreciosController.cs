using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Web.ApiClient.Clientes;

namespace Web.UI.Controllers
{
    [Authorize]
    public class PreciosController : Controller
    {
        private readonly IArticuloApiClient _articulos;
        private readonly ISocioNegocioApiClient _socios;

        public PreciosController(IArticuloApiClient articulos, ISocioNegocioApiClient socios)
        {
            _articulos = articulos;
            _socios = socios;
        }

        [HttpGet]
        public async Task<IActionResult> Articulo(string codigo, int? listaPrecio)
            => Json(await _articulos.ObtenerPrecioAsync(codigo, listaPrecio));

        [HttpGet]
        public async Task<IActionResult> ListaDeSocio(string codigo)
            => Json(await _socios.ObtenerAsync(codigo));
    }
}
