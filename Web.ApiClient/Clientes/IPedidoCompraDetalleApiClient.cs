using Web.ApiClient.Dtos;
using Web.ApiClient.Dtos.PedidoCompraDetalle;

namespace Web.ApiClient.Clientes
{
    public interface IPedidoCompraDetalleApiClient
    {
        Task<Respuesta<IEnumerable<PedidoCompraDetalleDTO>>> ObtenerTodoAsync();
        Task<Respuesta<IEnumerable<PedidoCompraDetalleDTO>>> ObtenerPorPedidoCompraAsync(int entry);
        Task<Respuesta<PedidoCompraDetalleDTO>> ObtenerAsync(int entry, int noLinea);
        Task<Respuesta<int>> InsertarAsync(PedidoCompraDetalleCrearDTO dto);
        Task<Respuesta<bool>> ActualizarAsync(int entry, int noLinea, PedidoCompraDetalleActualizarDTO dto);
        Task<Respuesta<bool>> EliminarAsync(int entry, int noLinea);
    }
}
