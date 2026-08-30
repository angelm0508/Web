using Web.ApiClient.Dtos;
using Web.ApiClient.Dtos.PedidoCompra;

namespace Web.ApiClient.Clientes
{
    public interface IPedidoCompraApiClient
    {
        Task<Respuesta<IEnumerable<PedidoCompraDTO>>> ObtenerTodoAsync();
        Task<Respuesta<PedidoCompraDTO>> ObtenerAsync(int entry);
        Task<Respuesta<int>> InsertarAsync(PedidoCompraCrearDTO dto);
        Task<Respuesta<bool>> ActualizarAsync(int entry, PedidoCompraActualizarDTO dto);
        Task<Respuesta<bool>> EliminarAsync(int entry);
    }
}
