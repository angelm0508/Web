using Web.ApiClient.Dtos;
using Web.ApiClient.Dtos.Usuario;

namespace Web.ApiClient.Clientes
{
    public interface IUsuarioApiClient
    {
        Task<Respuesta<IEnumerable<UsuarioDTO>>> ObtenerTodoAsync();
        Task<Respuesta<UsuarioDTO>> ObtenerAsync(int id);
    }
}
