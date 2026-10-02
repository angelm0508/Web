using System.Security.Claims;

namespace Web.UI.Authorization
{
    public static class ClaimsPrincipalExtensions
    {
        public static bool TienePermiso(this ClaimsPrincipal user, string codigoModulo, Accion accion)
        {
            if (user.FindFirst("SuperUsuario")?.Value == "S") return true;

            // "Usuarios" (administración de usuarios/permisos) es exclusivo de SuperUsuario: ningún
            // permiso por claim lo otorga.
            if (codigoModulo == "Usuarios") return false;

            var letra = accion switch
            {
                Accion.Ver => 'V',
                Accion.Agregar => 'A',
                Accion.Actualizar => 'U',
                Accion.Eliminar => 'E',
                _ => ' '
            };

            return user.FindAll("perm")
                .Select(c => c.Value.Split(':'))
                .Where(p => p.Length == 2 && p[0] == codigoModulo)
                .Any(p => p[1].Contains(letra));
        }
    }
}
