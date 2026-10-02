using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Web.ApiClient.Clientes;
using Web.UI.Authorization;

namespace Web.UI.Controllers
{
    [Authorize]
    public class UsuariosController : Controller
    {
        private readonly IUsuarioApiClient _usuarios;

        public UsuariosController(IUsuarioApiClient usuarios)
        {
            _usuarios = usuarios;
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
    }
}
