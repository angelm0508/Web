using Web.ApiClient.Dtos;
using Web.ApiClient.Dtos.SalidaMercancia;

namespace Web.ApiClient.Clientes
{
    public interface ISalidaMercanciaApiClient
    {
        Task<Respuesta<IEnumerable<SalidaMercanciaDTO>>> ObtenerTodoAsync();
        Task<Respuesta<SalidaMercanciaDTO>> ObtenerAsync(int entry);
        Task<Respuesta<int>> InsertarAsync(SalidaMercanciaCrearDTO dto);
        Task<Respuesta<bool>> ActualizarAsync(int entry, SalidaMercanciaActualizarDTO dto);
        Task<Respuesta<bool>> EliminarAsync(int entry);
    }
}
