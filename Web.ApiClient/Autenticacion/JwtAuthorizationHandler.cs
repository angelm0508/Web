using System.Net.Http.Headers;
using Microsoft.AspNetCore.Http;

namespace Web.ApiClient.Autenticacion
{
    /// <summary>
    /// Adjunta el JWT guardado en el claim de la cookie de sesión al header Authorization
    /// de cada petición saliente hacia la API.
    /// </summary>
    public class JwtAuthorizationHandler : DelegatingHandler
    {
        private readonly IHttpContextAccessor _httpContextAccessor;

        public JwtAuthorizationHandler(IHttpContextAccessor httpContextAccessor)
        {
            _httpContextAccessor = httpContextAccessor;
        }

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            var token = _httpContextAccessor.HttpContext?.User?.FindFirst(AuthConstants.ClaimJwtToken)?.Value;

            if (!string.IsNullOrEmpty(token))
            {
                request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
            }

            return base.SendAsync(request, cancellationToken);
        }
    }
}
