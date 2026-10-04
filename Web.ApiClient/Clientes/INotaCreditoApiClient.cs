using Web.ApiClient.Dtos;
using Web.ApiClient.Dtos.NotaCredito;

namespace Web.ApiClient.Clientes
{
    public interface INotaCreditoApiClient
    {
        Task<Respuesta<IEnumerable<NotaCreditoDTO>>> ObtenerTodoAsync();
        Task<Respuesta<NotaCreditoDTO>> ObtenerAsync(int entry);
        Task<Respuesta<int>> InsertarAsync(NotaCreditoCrearDTO dto);
        Task<Respuesta<bool>> ActualizarAsync(int entry, NotaCreditoActualizarDTO dto);
        Task<Respuesta<bool>> EliminarAsync(int entry);
        Task<Respuesta<IEnumerable<NotaCreditoDetalleDTO>>> ObtenerLineasAsync(int entry);
        Task<Respuesta<IEnumerable<NotaCreditoFacturaBaseResumenDTO>>> ObtenerFacturasBaseAsync(string codigoSn);
        Task<Respuesta<NotaCreditoFacturaBaseDTO>> ObtenerFacturaBaseAsync(int entry);
    }
}
