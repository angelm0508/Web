using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Web.ApiClient.Autenticacion;
using Web.ApiClient.Clientes;
using Web.ApiClient.Dtos.Autenticacion;
using Web.UI.Models.Cuenta;

namespace Web.UI.Controllers
{
    [AllowAnonymous]
    public class CuentaController : Controller
    {
        private readonly IAuthApiClient _authApiClient;

        public CuentaController(IAuthApiClient authApiClient)
        {
            _authApiClient = authApiClient;
        }

        [HttpGet]
        public IActionResult Login(string? returnUrl = null)
        {
            if (User.Identity?.IsAuthenticated == true)
                return RedirectToAction("Index", "Home");

            ViewData["ReturnUrl"] = returnUrl;
            return View(new LoginViewModel());
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Login(LoginViewModel modelo, string? returnUrl = null)
        {
            ViewData["ReturnUrl"] = returnUrl;

            if (!ModelState.IsValid)
                return View(modelo);

            var respuesta = await _authApiClient.LoginAsync(new LoginDTO
            {
                Usuario = modelo.Usuario,
                Contrasena = modelo.Contrasena
            });

            if (!respuesta.Resultado || respuesta.Dato is null || string.IsNullOrEmpty(respuesta.Dato.Token))
            {
                ModelState.AddModelError(string.Empty, respuesta.Mensaje);
                return View(modelo);
            }

            var claims = new List<Claim>
            {
                new(ClaimTypes.Name, respuesta.Dato.UsuarioNombre ?? modelo.Usuario),
                new(AuthConstants.ClaimJwtToken, respuesta.Dato.Token)
            };

            // El JWT ya fue validado/firmado por la API al emitirlo -- acá solo se decodifica para copiar
            // sus claims de autorizacion (SuperUsuario/perm) a la cookie de sesion de la Web, que hoy no
            // llevaba ninguno de los dos.
            var jwt = new JwtSecurityTokenHandler().ReadJwtToken(respuesta.Dato.Token);
            claims.AddRange(jwt.Claims.Where(c => c.Type == "SuperUsuario" || c.Type == "perm"));

            var identity = new ClaimsIdentity(claims, AuthConstants.EsquemaCookie);
            var principal = new ClaimsPrincipal(identity);

            await HttpContext.SignInAsync(AuthConstants.EsquemaCookie, principal, new AuthenticationProperties
            {
                IsPersistent = false,
                ExpiresUtc = respuesta.Dato.ExpirasEn
            });

            if (!string.IsNullOrEmpty(returnUrl) && Url.IsLocalUrl(returnUrl))
                return Redirect(returnUrl);

            return RedirectToAction("Index", "Home");
        }

        [HttpGet]
        public IActionResult AccesoDenegado()
        {
            return View();
        }

        [HttpPost]
        [Authorize]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Logout()
        {
            await HttpContext.SignOutAsync(AuthConstants.EsquemaCookie);
            return RedirectToAction("Login");
        }
    }
}
