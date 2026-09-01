using Web.ApiClient.Dtos;
using Web.ApiClient.Dtos.EntradaMercanciaDetalle;

namespace Web.ApiClient.Clientes
{
    public interface IEntradaMercanciaDetalleApiClient
    {
        Task<Respuesta<IEnumerable<EntradaMercanciaDetalleDTO>>> ObtenerTodoAsync();
        Task<Respuesta<IEnumerable<EntradaMercanciaDetalleDTO>>> ObtenerPorEntradaMercanciaAsync(int entry);
        Task<Respuesta<EntradaMercanciaDetalleDTO>> ObtenerAsync(int entry, int noLinea);
        Task<Respuesta<int>> InsertarAsync(EntradaMercanciaDetalleCrearDTO dto);
        Task<Respuesta<bool>> EliminarAsync(int entry, int noLinea);
    }
}
