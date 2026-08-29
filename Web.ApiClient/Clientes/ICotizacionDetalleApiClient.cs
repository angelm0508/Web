using Web.ApiClient.Dtos;
using Web.ApiClient.Dtos.CotizacionDetalle;

namespace Web.ApiClient.Clientes
{
    public interface ICotizacionDetalleApiClient
    {
        Task<Respuesta<IEnumerable<CotizacionDetalleDTO>>> ObtenerTodoAsync();
        Task<Respuesta<IEnumerable<CotizacionDetalleDTO>>> ObtenerPorCotizacionAsync(int entry);
        Task<Respuesta<CotizacionDetalleDTO>> ObtenerAsync(int entry, int noLinea);
        Task<Respuesta<int>> InsertarAsync(CotizacionDetalleCrearDTO dto);
        Task<Respuesta<bool>> ActualizarAsync(int entry, int noLinea, CotizacionDetalleActualizarDTO dto);
        Task<Respuesta<bool>> EliminarAsync(int entry, int noLinea);
    }
}
