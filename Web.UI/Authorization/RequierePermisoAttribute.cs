using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace Web.UI.Authorization
{
    [AttributeUsage(AttributeTargets.Method)]
    public class RequierePermisoAttribute : Attribute, IAuthorizationFilter
    {
        private readonly string _codigoModulo;
        private readonly Accion _accion;

        public RequierePermisoAttribute(string codigoModulo, Accion accion)
        {
            _codigoModulo = codigoModulo;
            _accion = accion;
        }

        public void OnAuthorization(AuthorizationFilterContext context)
        {
            if (!context.HttpContext.User.TienePermiso(_codigoModulo, _accion))
            {
                context.Result = new RedirectToActionResult("AccesoDenegado", "Cuenta", null);
            }
        }
    }
}
