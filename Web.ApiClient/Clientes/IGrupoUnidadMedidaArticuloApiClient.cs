using Web.ApiClient.Dtos;
using Web.ApiClient.Dtos.GrupoUnidadMedidaArticulo;

namespace Web.ApiClient.Clientes
{
    public interface IGrupoUnidadMedidaArticuloApiClient
    {
        Task<Respuesta<IEnumerable<GrupoUnidadMedidaArticuloDTO>>> ObtenerTodoAsync();
        Task<Respuesta<GrupoUnidadMedidaArticuloDTO>> ObtenerAsync(int id);
        Task<Respuesta<int>> InsertarAsync(GrupoUnidadMedidaArticuloCrearDTO dto);
        Task<Respuesta<bool>> ActualizarAsync(int id, GrupoUnidadMedidaArticuloActualizarDTO dto);
        Task<Respuesta<bool>> EliminarAsync(int id);
    }
}
