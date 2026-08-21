using Web.ApiClient.Dtos;
using Web.ApiClient.Dtos.Autenticacion;

namespace Web.ApiClient.Clientes
{
    public class AuthApiClient : ApiClientBase, IAuthApiClient
    {
        public AuthApiClient(HttpClient http) : base(http) { }

        public Task<Respuesta<LoginResponseDTO>> LoginAsync(LoginDTO dto) =>
            PostAsync<LoginResponseDTO>("api/Auth/login", dto);
    }
}
