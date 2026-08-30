using Web.ApiClient.Dtos;
using Web.ApiClient.Dtos.EntregaCompraDetalle;

namespace Web.ApiClient.Clientes
{
    public interface IEntregaCompraDetalleApiClient
    {
        Task<Respuesta<IEnumerable<EntregaCompraDetalleDTO>>> ObtenerTodoAsync();
        Task<Respuesta<IEnumerable<EntregaCompraDetalleDTO>>> ObtenerPorEntregaCompraAsync(int entry);
        Task<Respuesta<EntregaCompraDetalleDTO>> ObtenerAsync(int entry, int noLinea);
        Task<Respuesta<int>> InsertarAsync(EntregaCompraDetalleCrearDTO dto);
        Task<Respuesta<bool>> ActualizarAsync(int entry, int noLinea, EntregaCompraDetalleActualizarDTO dto);
        Task<Respuesta<bool>> EliminarAsync(int entry, int noLinea);
    }
}
