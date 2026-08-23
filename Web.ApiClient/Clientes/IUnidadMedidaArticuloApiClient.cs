using Web.ApiClient.Dtos;
using Web.ApiClient.Dtos.UnidadMedidaArticulo;

namespace Web.ApiClient.Clientes
{
    public interface IUnidadMedidaArticuloApiClient
    {
        Task<Respuesta<IEnumerable<UnidadMedidaArticuloDTO>>> ObtenerTodoAsync();
        Task<Respuesta<UnidadMedidaArticuloDTO>> ObtenerAsync(int id);
        Task<Respuesta<int>> InsertarAsync(UnidadMedidaArticuloCrearDTO dto);
        Task<Respuesta<bool>> ActualizarAsync(int id, UnidadMedidaArticuloActualizarDTO dto);
        Task<Respuesta<bool>> EliminarAsync(int id);
    }
}
