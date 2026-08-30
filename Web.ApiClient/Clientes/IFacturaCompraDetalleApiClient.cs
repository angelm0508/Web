using Web.ApiClient.Dtos;
using Web.ApiClient.Dtos.FacturaCompraDetalle;

namespace Web.ApiClient.Clientes
{
    public interface IFacturaCompraDetalleApiClient
    {
        Task<Respuesta<IEnumerable<FacturaCompraDetalleDTO>>> ObtenerTodoAsync();
        Task<Respuesta<IEnumerable<FacturaCompraDetalleDTO>>> ObtenerPorFacturaCompraAsync(int entry);
        Task<Respuesta<FacturaCompraDetalleDTO>> ObtenerAsync(int entry, int noLinea);
        Task<Respuesta<int>> InsertarAsync(FacturaCompraDetalleCrearDTO dto);
        Task<Respuesta<bool>> ActualizarAsync(int entry, int noLinea, FacturaCompraDetalleActualizarDTO dto);
        Task<Respuesta<bool>> EliminarAsync(int entry, int noLinea);
    }
}
