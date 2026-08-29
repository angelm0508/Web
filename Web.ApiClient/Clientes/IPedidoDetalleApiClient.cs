using Web.ApiClient.Dtos;
using Web.ApiClient.Dtos.PedidoDetalle;

namespace Web.ApiClient.Clientes
{
    public interface IPedidoDetalleApiClient
    {
        Task<Respuesta<IEnumerable<PedidoDetalleDTO>>> ObtenerTodoAsync();
        Task<Respuesta<IEnumerable<PedidoDetalleDTO>>> ObtenerPorPedidoAsync(int entry);
        Task<Respuesta<PedidoDetalleDTO>> ObtenerAsync(int entry, int noLinea);
        Task<Respuesta<int>> InsertarAsync(PedidoDetalleCrearDTO dto);
        Task<Respuesta<bool>> ActualizarAsync(int entry, int noLinea, PedidoDetalleActualizarDTO dto);
        Task<Respuesta<bool>> EliminarAsync(int entry, int noLinea);
    }
}
