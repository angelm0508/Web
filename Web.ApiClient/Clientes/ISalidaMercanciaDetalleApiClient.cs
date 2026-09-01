using Web.ApiClient.Dtos;
using Web.ApiClient.Dtos.SalidaMercanciaDetalle;

namespace Web.ApiClient.Clientes
{
    public interface ISalidaMercanciaDetalleApiClient
    {
        Task<Respuesta<IEnumerable<SalidaMercanciaDetalleDTO>>> ObtenerTodoAsync();
        Task<Respuesta<IEnumerable<SalidaMercanciaDetalleDTO>>> ObtenerPorSalidaMercanciaAsync(int entry);
        Task<Respuesta<SalidaMercanciaDetalleDTO>> ObtenerAsync(int entry, int noLinea);
        Task<Respuesta<int>> InsertarAsync(SalidaMercanciaDetalleCrearDTO dto);
        Task<Respuesta<bool>> EliminarAsync(int entry, int noLinea);
    }
}
