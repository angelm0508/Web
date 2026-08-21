using Web.ApiClient.Dtos;
using Web.ApiClient.Dtos.GrupoMedidaArticulo;

namespace Web.ApiClient.Clientes
{
    public interface IGrupoMedidaArticuloApiClient
    {
        Task<Respuesta<IEnumerable<GrupoMedidaArticuloDTO>>> ObtenerTodoAsync();
        Task<Respuesta<GrupoMedidaArticuloDTO>> ObtenerAsync(int id);
    }
}
