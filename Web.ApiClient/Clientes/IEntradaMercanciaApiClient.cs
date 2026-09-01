using Web.ApiClient.Dtos;
using Web.ApiClient.Dtos.EntradaMercancia;

namespace Web.ApiClient.Clientes
{
    public interface IEntradaMercanciaApiClient
    {
        Task<Respuesta<IEnumerable<EntradaMercanciaDTO>>> ObtenerTodoAsync();
        Task<Respuesta<EntradaMercanciaDTO>> ObtenerAsync(int entry);
        Task<Respuesta<int>> InsertarAsync(EntradaMercanciaCrearDTO dto);
        Task<Respuesta<bool>> ActualizarAsync(int entry, EntradaMercanciaActualizarDTO dto);
        Task<Respuesta<bool>> EliminarAsync(int entry);
    }
}
