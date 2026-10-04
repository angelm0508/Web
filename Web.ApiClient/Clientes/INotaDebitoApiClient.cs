using Web.ApiClient.Dtos;
using Web.ApiClient.Dtos.NotaDebito;

namespace Web.ApiClient.Clientes
{
    public interface INotaDebitoApiClient
    {
        Task<Respuesta<IEnumerable<NotaDebitoDTO>>> ObtenerTodoAsync();
        Task<Respuesta<NotaDebitoDTO>> ObtenerAsync(int entry);
        Task<Respuesta<int>> InsertarAsync(NotaDebitoCrearDTO dto);
        Task<Respuesta<bool>> ActualizarAsync(int entry, NotaDebitoActualizarDTO dto);
        Task<Respuesta<bool>> EliminarAsync(int entry);
        Task<Respuesta<IEnumerable<NotaDebitoDetalleDTO>>> ObtenerLineasAsync(int entry);
        Task<Respuesta<IEnumerable<NotaDebitoFacturaBaseResumenDTO>>> ObtenerFacturasBaseAsync(string codigoSn);
        Task<Respuesta<NotaDebitoFacturaBaseDTO>> ObtenerFacturaBaseAsync(int entry);
    }
}
