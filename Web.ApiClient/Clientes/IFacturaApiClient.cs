using Web.ApiClient.Dtos;
using Web.ApiClient.Dtos.Factura;

namespace Web.ApiClient.Clientes
{
    public interface IFacturaApiClient
    {
        Task<Respuesta<IEnumerable<FacturaDTO>>> ObtenerTodoAsync();
        Task<Respuesta<FacturaDTO>> ObtenerAsync(int entry);
        Task<Respuesta<int>> InsertarAsync(FacturaCrearDTO dto);
        Task<Respuesta<bool>> ActualizarAsync(int entry, FacturaActualizarDTO dto);
        Task<Respuesta<bool>> EliminarAsync(int entry);
    }
}
