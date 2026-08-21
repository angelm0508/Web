using Web.ApiClient.Dtos;
using Web.ApiClient.Dtos.GrupoSn;

namespace Web.ApiClient.Clientes
{
    public interface IGrupoSnApiClient
    {
        Task<Respuesta<IEnumerable<GrupoSnDTO>>> ObtenerTodoAsync();
        Task<Respuesta<GrupoSnDTO>> ObtenerAsync(int id);
        Task<Respuesta<int>> InsertarAsync(GrupoSnCrearDTO dto);
        Task<Respuesta<bool>> ActualizarAsync(int id, GrupoSnActualizarDTO dto);
        Task<Respuesta<bool>> EliminarAsync(int id);
    }
}
