using Web.ApiClient.Dtos;
using Web.ApiClient.Dtos.EntregaDetalle;

namespace Web.ApiClient.Clientes
{
    public interface IEntregaDetalleApiClient
    {
        Task<Respuesta<IEnumerable<EntregaDetalleDTO>>> ObtenerTodoAsync();
        Task<Respuesta<IEnumerable<EntregaDetalleDTO>>> ObtenerPorEntregaAsync(int entry);
        Task<Respuesta<EntregaDetalleDTO>> ObtenerAsync(int entry, int noLinea);
        Task<Respuesta<int>> InsertarAsync(EntregaDetalleCrearDTO dto);
        Task<Respuesta<bool>> ActualizarAsync(int entry, int noLinea, EntregaDetalleActualizarDTO dto);
        Task<Respuesta<bool>> EliminarAsync(int entry, int noLinea);
    }
}
