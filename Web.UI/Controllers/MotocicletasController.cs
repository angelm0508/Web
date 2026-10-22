using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Web.ApiClient.Clientes;
using Web.ApiClient.Dtos.Motocicleta;
using Web.UI.Authorization;

namespace Web.UI.Controllers
{
    [Authorize]
    public class MotocicletasController : Controller
    {
        private readonly IMotocicletaApiClient _motos;
        private readonly ISocioNegocioApiClient _socios;

        public MotocicletasController(IMotocicletaApiClient motos, ISocioNegocioApiClient socios)
        {
            _motos = motos;
            _socios = socios;
        }

        [RequierePermiso("Motocicletas", Accion.Ver)]
        public IActionResult Index() => View();

        [HttpGet]
        [RequierePermiso("Motocicletas", Accion.Ver)]
        public async Task<IActionResult> ObtenerTodos()
        {
            var respuesta = await _motos.BuscarAsync(null, null);
            return Json(respuesta);
        }

        [HttpGet]
        [RequierePermiso("Motocicletas", Accion.Agregar)]
        public IActionResult FormularioCrear()
        {
            ViewBag.EsEdicion = false;
            return PartialView("_Form", new MotocicletaCrearDTO { Activo = "S" });
        }

        [HttpGet]
        [RequierePermiso("Motocicletas", Accion.Actualizar)]
        public async Task<IActionResult> FormularioEditar(int entry)
        {
            var respuesta = await _motos.ObtenerAsync(entry);
            if (!respuesta.Resultado || respuesta.Dato is null)
                return NotFound();

            ViewBag.EsEdicion = true;
            ViewBag.EntryActual = entry;
            ViewBag.NombreCliente = respuesta.Dato.NombreSn;
            var dto = new MotocicletaCrearDTO
            {
                CodigoSn = respuesta.Dato.CodigoSn,
                Placa = respuesta.Dato.Placa,
                Marca = respuesta.Dato.Marca,
                Modelo = respuesta.Dato.Modelo,
                Anio = respuesta.Dato.Anio,
                Color = respuesta.Dato.Color,
                Vin = respuesta.Dato.Vin,
                Comentario = respuesta.Dato.Comentario,
                Activo = respuesta.Dato.Activo
            };
            return PartialView("_Form", dto);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        [RequierePermiso("Motocicletas", Accion.Agregar)]
        public async Task<IActionResult> Crear([FromBody] MotocicletaCrearDTO dto)
        {
            var respuesta = await _motos.InsertarAsync(dto);
            return Json(respuesta);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        [RequierePermiso("Motocicletas", Accion.Actualizar)]
        public async Task<IActionResult> Editar(int entry, [FromBody] MotocicletaCrearDTO dto)
        {
            var actualizar = new MotocicletaActualizarDTO
            {
                CodigoSn = dto.CodigoSn, Placa = dto.Placa, Marca = dto.Marca, Modelo = dto.Modelo, Anio = dto.Anio,
                Color = dto.Color, Vin = dto.Vin, Comentario = dto.Comentario, Activo = dto.Activo
            };
            var respuesta = await _motos.ActualizarAsync(entry, actualizar);
            return Json(respuesta);
        }

        // Baja lógica: la motocicleta pasa a inactiva (puede tener órdenes de servicio).
        [HttpPost]
        [ValidateAntiForgeryToken]
        [RequierePermiso("Motocicletas", Accion.Eliminar)]
        public async Task<IActionResult> Eliminar(int entry)
        {
            var respuesta = await _motos.EliminarAsync(entry);
            return Json(respuesta);
        }

        // La API exige además Ver en OrdenesServicio (el historial lista órdenes).
        [HttpGet]
        [RequierePermiso("Motocicletas", Accion.Ver)]
        public async Task<IActionResult> ObtenerHistorial(int entry)
        {
            var respuesta = await _motos.ObtenerHistorialAsync(entry);
            return Json(respuesta);
        }

        [HttpGet]
        [RequierePermiso("Motocicletas", Accion.Ver)]
        public async Task<IActionResult> BuscarSocios(string texto)
        {
            var respuesta = string.IsNullOrEmpty(texto)
                ? await _socios.ObtenerTodoAsync("C")
                : await _socios.ObtenerContenganNombreAsync(texto, "C");
            return Json(respuesta);
        }
    }
}
