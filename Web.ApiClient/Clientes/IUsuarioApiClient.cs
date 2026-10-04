using Web.ApiClient.Dtos;
using Web.ApiClient.Dtos.Usuario;

namespace Web.ApiClient.Clientes
{
    public interface IUsuarioApiClient
    {
        Task<Respuesta<IEnumerable<UsuarioDTO>>> ObtenerTodoAsync();
        Task<Respuesta<UsuarioDTO>> ObtenerAsync(int id);
        Task<Respuesta<int>> InsertarAsync(UsuarioCrearDTO dto);
        Task<Respuesta<bool>> ActualizarAsync(int id, UsuarioActualizarDTO dto);
        Task<Respuesta<bool>> EliminarAsync(int id);
    }
}
