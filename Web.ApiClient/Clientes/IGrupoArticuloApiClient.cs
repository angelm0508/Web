using Web.ApiClient.Dtos;
using Web.ApiClient.Dtos.GrupoArticulo;

namespace Web.ApiClient.Clientes
{
    public interface IGrupoArticuloApiClient
    {
        Task<Respuesta<IEnumerable<GrupoArticuloDTO>>> ObtenerTodoAsync();
        Task<Respuesta<GrupoArticuloDTO>> ObtenerAsync(int id);
        Task<Respuesta<int>> InsertarAsync(GrupoArticuloCrearDTO dto);
        Task<Respuesta<bool>> ActualizarAsync(int id, GrupoArticuloActualizarDTO dto);
        Task<Respuesta<bool>> EliminarAsync(int id);
    }
}
