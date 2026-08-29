using Web.ApiClient.Dtos;
using Web.ApiClient.Dtos.Entrega;

namespace Web.ApiClient.Clientes
{
    public interface IEntregaApiClient
    {
        Task<Respuesta<IEnumerable<EntregaDTO>>> ObtenerTodoAsync();
        Task<Respuesta<EntregaDTO>> ObtenerAsync(int entry);
        Task<Respuesta<int>> InsertarAsync(EntregaCrearDTO dto);
        Task<Respuesta<bool>> ActualizarAsync(int entry, EntregaActualizarDTO dto);
        Task<Respuesta<bool>> EliminarAsync(int entry);
    }
}
