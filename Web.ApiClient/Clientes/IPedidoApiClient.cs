using Web.ApiClient.Dtos;
using Web.ApiClient.Dtos.Pedido;

namespace Web.ApiClient.Clientes
{
    public interface IPedidoApiClient
    {
        Task<Respuesta<IEnumerable<PedidoDTO>>> ObtenerTodoAsync();
        Task<Respuesta<PedidoDTO>> ObtenerAsync(int entry);
        Task<RespuestaCredito<int>> InsertarAsync(PedidoCrearDTO dto);
        Task<RespuestaCredito<bool>> ActualizarAsync(int entry, PedidoActualizarDTO dto);
        Task<Respuesta<bool>> EliminarAsync(int entry);
    }
}
