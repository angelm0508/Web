using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Web.ApiClient.Clientes;
using Web.ApiClient.Dtos.Permiso;
using Web.UI.Authorization;

namespace Web.UI.Controllers
{
    [Authorize]
    public class UsuariosController : Controller
    {
        private readonly IUsuarioApiClient _usuarios;
        private readonly IModuloApiClient _modulos;
        private readonly IUsuarioPermisoApiClient _usuarioPermisos;
        private readonly IPlantillaApiClient _plantillas;

        public UsuariosController(IUsuarioApiClient usuarios, IModuloApiClient modulos, IUsuarioPermisoApiClient usuarioPermisos, IPlantillaApiClient plantillas)
        {
            _usuarios = usuarios;
            _modulos = modulos;
            _usuarioPermisos = usuarioPermisos;
            _plantillas = plantillas;
        }

        [RequierePermiso("Usuarios", Accion.Ver)]
        public IActionResult Index() => View();

        [HttpGet]
        [RequierePermiso("Usuarios", Accion.Ver)]
        public async Task<IActionResult> ObtenerTodos()
        {
            var respuesta = await _usuarios.ObtenerTodoAsync();
            return Json(respuesta);
        }

        [RequierePermiso("Usuarios", Accion.Ver)]
        public IActionResult Permisos(int usuarioId) => View();

        [HttpGet]
        [RequierePermiso("Usuarios", Accion.Ver)]
        public async Task<IActionResult> ObtenerModulos() => Json(await _modulos.ObtenerTodoAsync());

        [HttpGet]
        [RequierePermiso("Usuarios", Accion.Ver)]
        public async Task<IActionResult> ObtenerPermisos(int usuarioId) => Json(await _usuarioPermisos.ObtenerAsync(usuarioId));

        [HttpGet]
        [RequierePermiso("Usuarios", Accion.Ver)]
        public async Task<IActionResult> ObtenerPlantillas() => Json(await _plantillas.ObtenerTodoAsync());

        public class GuardarPermisosRequest
        {
            public int UsuarioId { get; set; }
            public List<PermisoModuloDTO> Matriz { get; set; } = new();
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        [RequierePermiso("Usuarios", Accion.Actualizar)]
        public async Task<IActionResult> GuardarPermisos([FromBody] GuardarPermisosRequest body) =>
            Json(await _usuarioPermisos.GuardarAsync(body.UsuarioId, body.Matriz));

        public class AplicarPlantillaRequest
        {
            public int UsuarioId { get; set; }
            public int PlantillaId { get; set; }
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        [RequierePermiso("Usuarios", Accion.Actualizar)]
        public async Task<IActionResult> AplicarPlantilla([FromBody] AplicarPlantillaRequest body) =>
            Json(await _usuarioPermisos.AplicarPlantillaAsync(body.UsuarioId, body.PlantillaId));
    }
}
