using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Rendering;
using Web.ApiClient.Clientes;
using Web.ApiClient.Dtos.Articulo;

namespace Web.UI.Controllers
{
    [Authorize]
    public class ArticulosController : Controller
    {
        private readonly IArticuloApiClient _articulos;
        private readonly IFabricanteArticuloApiClient _fabricantes;
        private readonly IGrupoArticuloApiClient _grupos;
        private readonly IGrupoMedidaArticuloApiClient _gruposMedida;

        public ArticulosController(
            IArticuloApiClient articulos,
            IFabricanteArticuloApiClient fabricantes,
            IGrupoArticuloApiClient grupos,
            IGrupoMedidaArticuloApiClient gruposMedida)
        {
            _articulos = articulos;
            _fabricantes = fabricantes;
            _grupos = grupos;
            _gruposMedida = gruposMedida;
        }

        public IActionResult Index() => View();

        [HttpGet]
        public async Task<IActionResult> ObtenerTodos()
        {
            var respuesta = await _articulos.ObtenerTodoAsync();
            return Json(respuesta);
        }

        [HttpGet]
        public async Task<IActionResult> FormularioCrear()
        {
            await CargarDropdownsAsync();
            ViewBag.EsEdicion = false;
            return PartialView("_Form", new ArticuloCrearDTO { Activo = "S", ArticuloCompra = "S", ArticuloVenta = "S", ArticuloInventario = "S", NoApliDesc = "N", GestNoSerie = "N", GestLote = "N", GestPorAlmacen = "N" });
        }

        [HttpGet]
        public async Task<IActionResult> FormularioEditar(string codigo)
        {
            var respuesta = await _articulos.ObtenerAsync(codigo);
            if (!respuesta.Resultado || respuesta.Dato is null)
                return NotFound();

            await CargarDropdownsAsync();
            ViewBag.EsEdicion = true;

            var dto = new ArticuloCrearDTO
            {
                Codigo = codigo,
                Nombre = respuesta.Dato.Nombre,
                CodigoGrupo = respuesta.Dato.CodigoGrupo,
                CodigoGrpMedida = respuesta.Dato.CodigoGrpMedida,
                FabricanteEntry = respuesta.Dato.FabricanteEntry,
                Activo = respuesta.Dato.Activo,
                ArticuloCompra = respuesta.Dato.ArticuloCompra,
                ArticuloVenta = respuesta.Dato.ArticuloVenta,
                ArticuloInventario = respuesta.Dato.ArticuloInventario,
                PrecioUnitario = respuesta.Dato.PrecioUnitario,
                CantDisponible = respuesta.Dato.CantDisponible,
                CantConfirmada = respuesta.Dato.CantConfirmada,
                CantPedida = respuesta.Dato.CantPedida,
                AlmacenDefecto = respuesta.Dato.AlmacenDefecto,
                NoApliDesc = respuesta.Dato.NoApliDesc,
                GestNoSerie = respuesta.Dato.GestNoSerie,
                GestLote = respuesta.Dato.GestLote,
                GestPorAlmacen = respuesta.Dato.GestPorAlmacen,
                Minimo = respuesta.Dato.Minimo,
                Maximo = respuesta.Dato.Maximo,
                Comentarios = respuesta.Dato.Comentarios
            };

            return PartialView("_Form", dto);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Crear([FromBody] ArticuloCrearDTO dto)
        {
            var respuesta = await _articulos.InsertarAsync(dto);
            return Json(respuesta);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Editar(string codigo, [FromBody] ArticuloCrearDTO dto)
        {
            var actualizar = new ArticuloActualizarDTO
            {
                Codigo = codigo,
                Nombre = dto.Nombre,
                CodigoGrupo = dto.CodigoGrupo,
                CodigoGrpMedida = dto.CodigoGrpMedida,
                FabricanteEntry = dto.FabricanteEntry,
                Activo = dto.Activo,
                ArticuloCompra = dto.ArticuloCompra,
                ArticuloVenta = dto.ArticuloVenta,
                ArticuloInventario = dto.ArticuloInventario,
                PrecioUnitario = dto.PrecioUnitario,
                CantDisponible = dto.CantDisponible,
                CantConfirmada = dto.CantConfirmada,
                CantPedida = dto.CantPedida,
                AlmacenDefecto = dto.AlmacenDefecto,
                NoApliDesc = dto.NoApliDesc,
                GestNoSerie = dto.GestNoSerie,
                GestLote = dto.GestLote,
                GestPorAlmacen = dto.GestPorAlmacen,
                Minimo = dto.Minimo,
                Maximo = dto.Maximo,
                Comentarios = dto.Comentarios
            };

            var respuesta = await _articulos.ActualizarAsync(codigo, actualizar);
            return Json(respuesta);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Eliminar(string codigo)
        {
            var respuesta = await _articulos.EliminarAsync(codigo);
            return Json(respuesta);
        }

        private async Task CargarDropdownsAsync()
        {
            var fabricantes = await _fabricantes.ObtenerTodoAsync();
            var grupos = await _grupos.ObtenerTodoAsync();
            var gruposMedida = await _gruposMedida.ObtenerTodoAsync();

            ViewBag.Fabricantes = new SelectList(fabricantes.Dato ?? [], "Entry", "Nombre");
            ViewBag.Grupos = new SelectList(grupos.Dato ?? [], "Codigo", "Nombre");
            ViewBag.GruposMedida = new SelectList(gruposMedida.Dato ?? [], "Entry", "Nombre");
        }
    }
}
