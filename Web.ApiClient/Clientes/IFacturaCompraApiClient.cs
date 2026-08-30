using Web.ApiClient.Dtos;
using Web.ApiClient.Dtos.FacturaCompra;

namespace Web.ApiClient.Clientes
{
    public interface IFacturaCompraApiClient
    {
        Task<Respuesta<IEnumerable<FacturaCompraDTO>>> ObtenerTodoAsync();
        Task<Respuesta<FacturaCompraDTO>> ObtenerAsync(int entry);
        Task<Respuesta<int>> InsertarAsync(FacturaCompraCrearDTO dto);
        Task<Respuesta<bool>> ActualizarAsync(int entry, FacturaCompraActualizarDTO dto);
        Task<Respuesta<bool>> EliminarAsync(int entry);
    }
}
