using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Web.ApiClient.Clientes;

namespace Web.UI.Controllers
{
    [Authorize]
    public class ExistenciasController : Controller
    {
        private readonly IExistenciaApiClient _existencias;
        private readonly IMovimientoInventarioApiClient _movimientos;
        private readonly IArticuloApiClient _articulos;

        public ExistenciasController(
            IExistenciaApiClient existencias,
            IMovimientoInventarioApiClient movimientos,
            IArticuloApiClient articulos)
        {
            _existencias = existencias;
            _movimientos = movimientos;
            _articulos = articulos;
        }

        public IActionResult Index() => View();

        [HttpGet]
        public async Task<IActionResult> ObtenerTodos(string? articulo, string? almacen)
        {
            var respuesta = await _existencias.ObtenerTodoAsync(articulo, almacen);
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
        public async Task<IActionResult> Kardex(string codArticulo)
        {
            var respuesta = await _movimientos.ObtenerPorArticuloAsync(codArticulo);
            return Json(respuesta);
        }
    }
}
