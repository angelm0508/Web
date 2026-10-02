using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Web.ApiClient.Clientes;
using Web.ApiClient.Dtos.Permiso;
using Web.UI.Authorization;

namespace Web.UI.Controllers
{
    [Authorize]
    public class PlantillasController : Controller
    {
        private readonly IPlantillaApiClient _plantillas;
        private readonly IModuloApiClient _modulos;

        public PlantillasController(IPlantillaApiClient plantillas, IModuloApiClient modulos)
        {
            _plantillas = plantillas;
            _modulos = modulos;
        }

        [RequierePermiso("Usuarios", Accion.Ver)]
        public IActionResult Index() => View();

        [HttpGet]
        [RequierePermiso("Usuarios", Accion.Ver)]
        public async Task<IActionResult> ObtenerTodos() => Json(await _plantillas.ObtenerTodoAsync());

        [HttpPost]
        [RequierePermiso("Usuarios", Accion.Agregar)]
        public async Task<IActionResult> Crear([FromBody] PlantillaCrearDTO dto) => Json(await _plantillas.InsertarAsync(dto));

        [HttpPost]
        [RequierePermiso("Usuarios", Accion.Actualizar)]
        public async Task<IActionResult> Editar(int id, [FromBody] PlantillaActualizarDTO dto) => Json(await _plantillas.ActualizarAsync(id, dto));

        [HttpPost]
        [RequierePermiso("Usuarios", Accion.Eliminar)]
        public async Task<IActionResult> Eliminar(int id) => Json(await _plantillas.EliminarAsync(id));

        [RequierePermiso("Usuarios", Accion.Ver)]
        public IActionResult Permisos(int plantillaId) => View();

        [HttpGet]
        [RequierePermiso("Usuarios", Accion.Ver)]
        public async Task<IActionResult> ObtenerModulos() => Json(await _modulos.ObtenerTodoAsync());

        [HttpGet]
        [RequierePermiso("Usuarios", Accion.Ver)]
        public async Task<IActionResult> ObtenerPermisos(int plantillaId) => Json(await _plantillas.ObtenerPermisosAsync(plantillaId));

        public class GuardarPermisosRequest
        {
            public int PlantillaId { get; set; }
            public List<PermisoModuloDTO> Matriz { get; set; } = new();
        }

        [HttpPost]
        [RequierePermiso("Usuarios", Accion.Actualizar)]
        public async Task<IActionResult> GuardarPermisos([FromBody] GuardarPermisosRequest body) =>
            Json(await _plantillas.GuardarPermisosAsync(body.PlantillaId, body.Matriz));
    }
}
