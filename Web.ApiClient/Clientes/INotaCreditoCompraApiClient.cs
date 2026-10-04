using Web.ApiClient.Dtos;
using Web.ApiClient.Dtos.NotaCreditoCompra;

namespace Web.ApiClient.Clientes
{
    public interface INotaCreditoCompraApiClient
    {
        Task<Respuesta<IEnumerable<NotaCreditoCompraDTO>>> ObtenerTodoAsync();
        Task<Respuesta<NotaCreditoCompraDTO>> ObtenerAsync(int entry);
        Task<Respuesta<int>> InsertarAsync(NotaCreditoCompraCrearDTO dto);
        Task<Respuesta<bool>> ActualizarAsync(int entry, NotaCreditoCompraActualizarDTO dto);
        Task<Respuesta<bool>> EliminarAsync(int entry);
        Task<Respuesta<IEnumerable<NotaCreditoCompraDetalleDTO>>> ObtenerLineasAsync(int entry);
        Task<Respuesta<IEnumerable<NotaCreditoCompraFacturaBaseResumenDTO>>> ObtenerFacturasCompraBaseAsync(string codigoSn);
        Task<Respuesta<NotaCreditoCompraFacturaBaseDTO>> ObtenerFacturaCompraBaseAsync(int entry);
    }
}
