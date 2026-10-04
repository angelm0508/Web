using Web.ApiClient.Dtos;
using Web.ApiClient.Dtos.NotaDebitoCompra;

namespace Web.ApiClient.Clientes
{
    public interface INotaDebitoCompraApiClient
    {
        Task<Respuesta<IEnumerable<NotaDebitoCompraDTO>>> ObtenerTodoAsync();
        Task<Respuesta<NotaDebitoCompraDTO>> ObtenerAsync(int entry);
        Task<Respuesta<int>> InsertarAsync(NotaDebitoCompraCrearDTO dto);
        Task<Respuesta<bool>> ActualizarAsync(int entry, NotaDebitoCompraActualizarDTO dto);
        Task<Respuesta<bool>> EliminarAsync(int entry);
        Task<Respuesta<IEnumerable<NotaDebitoCompraDetalleDTO>>> ObtenerLineasAsync(int entry);
        Task<Respuesta<IEnumerable<NotaDebitoCompraFacturaBaseResumenDTO>>> ObtenerFacturasCompraBaseAsync(string codigoSn);
        Task<Respuesta<NotaDebitoCompraFacturaBaseDTO>> ObtenerFacturaCompraBaseAsync(int entry);
    }
}
