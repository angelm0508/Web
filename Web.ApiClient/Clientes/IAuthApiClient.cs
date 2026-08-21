using Web.ApiClient.Dtos;
using Web.ApiClient.Dtos.Autenticacion;

namespace Web.ApiClient.Clientes
{
    public interface IAuthApiClient
    {
        Task<Respuesta<LoginResponseDTO>> LoginAsync(LoginDTO dto);
    }
}
