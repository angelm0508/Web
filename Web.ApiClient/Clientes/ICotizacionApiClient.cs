using Web.ApiClient.Dtos;
using Web.ApiClient.Dtos.Cotizacion;

namespace Web.ApiClient.Clientes
{
    public interface ICotizacionApiClient
    {
        Task<Respuesta<IEnumerable<CotizacionDTO>>> ObtenerTodoAsync();
        Task<Respuesta<CotizacionDTO>> ObtenerAsync(int entry);
        Task<Respuesta<int>> InsertarAsync(CotizacionCrearDTO dto);
        Task<Respuesta<bool>> ActualizarAsync(int entry, CotizacionActualizarDTO dto);
        Task<Respuesta<bool>> EliminarAsync(int entry);
    }
}
