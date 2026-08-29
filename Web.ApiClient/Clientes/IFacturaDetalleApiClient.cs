using Web.ApiClient.Dtos;
using Web.ApiClient.Dtos.FacturaDetalle;

namespace Web.ApiClient.Clientes
{
    public interface IFacturaDetalleApiClient
    {
        Task<Respuesta<IEnumerable<FacturaDetalleDTO>>> ObtenerTodoAsync();
        Task<Respuesta<IEnumerable<FacturaDetalleDTO>>> ObtenerPorFacturaAsync(int entry);
        Task<Respuesta<FacturaDetalleDTO>> ObtenerAsync(int entry, int noLinea);
        Task<Respuesta<int>> InsertarAsync(FacturaDetalleCrearDTO dto);
        Task<Respuesta<bool>> ActualizarAsync(int entry, int noLinea, FacturaDetalleActualizarDTO dto);
        Task<Respuesta<bool>> EliminarAsync(int entry, int noLinea);
    }
}
