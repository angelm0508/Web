using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Rendering;
using Web.ApiClient.Clientes;
using Web.ApiClient.Dtos.ListadoPrecio;

namespace Web.UI.Controllers
{
    [Authorize]
    public class ListadosPrecioController : Controller
    {
        private readonly IListadoPrecioApiClient _listados;

        public ListadosPrecioController(IListadoPrecioApiClient listados)
        {
            _listados = listados;
        }

        public IActionResult Index() => View();

        [HttpGet]
        public async Task<IActionResult> ObtenerTodos()
        {
            var respuesta = await _listados.ObtenerTodoAsync();
            return Json(respuesta);
        }

        [HttpGet]
        public async Task<IActionResult> FormularioCrear()
        {
            await CargarDropdownsAsync(null);
            ViewBag.EsEdicion = false;
            return PartialView("_Form", new ListadoPrecioCrearDTO());
        }

        [HttpGet]
        public async Task<IActionResult> FormularioEditar(int id)
        {
            var respuesta = await _listados.ObtenerAsync(id);
            if (!respuesta.Resultado || respuesta.Dato is null)
                return NotFound();

            await CargarDropdownsAsync(id);
            ViewBag.EsEdicion = true;
            ViewBag.Id = id;

            var dto = new ListadoPrecioCrearDTO
            {
                Nombre = respuesta.Dato.Nombre,
                Base = respuesta.Dato.Base,
                Factor = respuesta.Dato.Factor,
                MetodoRedondeo = respuesta.Dato.MetodoRedondeo,
                ReglaRedondeo = respuesta.Dato.ReglaRedondeo
            };

            return PartialView("_Form", dto);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Crear([FromBody] ListadoPrecioCrearDTO dto)
        {
            var respuesta = await _listados.InsertarAsync(dto);
            return Json(respuesta);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Editar(int id, [FromBody] ListadoPrecioCrearDTO dto)
        {
            var actualizar = new ListadoPrecioActualizarDTO
            {
                Nombre = dto.Nombre,
                Base = dto.Base,
                Factor = dto.Factor,
                MetodoRedondeo = dto.MetodoRedondeo,
                ReglaRedondeo = dto.ReglaRedondeo
            };

            var respuesta = await _listados.ActualizarAsync(id, actualizar);
            return Json(respuesta);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Eliminar(int id)
        {
            var respuesta = await _listados.EliminarAsync(id);
            return Json(respuesta);
        }

        private async Task CargarDropdownsAsync(int? idActual)
        {
            var listados = await _listados.ObtenerTodoAsync();
            var opciones = listados.Dato ?? [];
            if (idActual.HasValue)
            {
                // Una lista de precio no puede tomarse a sí misma como base.
                opciones = opciones.Where(x => x.Entry != idActual.Value);
            }
            var opcionesBase = opciones.ToList();
            ViewBag.Listados = new SelectList(opcionesBase, "Entry", "Nombre");
            // El placeholder "-- Ninguna --" solo tiene sentido si de verdad no hay ninguna otra
            // lista disponible para elegir como base (p. ej. la primera lista que se crea) -- si
            // ya existen otras, el campo pasa a ser obligatorio y no debe mostrarse.
            ViewBag.HayListasBase = opcionesBase.Count > 0;

            ViewBag.MetodosRedondeo = new SelectList(new[]
            {
                new { Valor = 0, Texto = "Ninguno" },
                new { Valor = 1, Texto = "Redondear a la unidad" },
                new { Valor = 2, Texto = "Redondear a 0.5" },
                new { Valor = 3, Texto = "Redondear a 5" },
                new { Valor = 4, Texto = "Redondear a 10" },
                new { Valor = 5, Texto = "Redondear a 25" }
            }, "Valor", "Texto");

            ViewBag.ReglasRedondeo = new SelectList(new[]
            {
                new { Valor = "F", Texto = "Hacia abajo" },
                new { Valor = "C", Texto = "Hacia arriba" },
                new { Valor = "R", Texto = "Al más cercano" }
            }, "Valor", "Texto");
        }
    }
}
