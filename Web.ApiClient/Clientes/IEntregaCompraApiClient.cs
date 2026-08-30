using Web.ApiClient.Dtos;
using Web.ApiClient.Dtos.EntregaCompra;

namespace Web.ApiClient.Clientes
{
    public interface IEntregaCompraApiClient
    {
        Task<Respuesta<IEnumerable<EntregaCompraDTO>>> ObtenerTodoAsync();
        Task<Respuesta<EntregaCompraDTO>> ObtenerAsync(int entry);
        Task<Respuesta<int>> InsertarAsync(EntregaCompraCrearDTO dto);
        Task<Respuesta<bool>> ActualizarAsync(int entry, EntregaCompraActualizarDTO dto);
        Task<Respuesta<bool>> EliminarAsync(int entry);
    }
}
