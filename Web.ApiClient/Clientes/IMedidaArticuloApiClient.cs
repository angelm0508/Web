using Web.ApiClient.Dtos;
using Web.ApiClient.Dtos.MedidaArticulo;

namespace Web.ApiClient.Clientes
{
    public interface IMedidaArticuloApiClient
    {
        Task<Respuesta<IEnumerable<MedidaArticuloDTO>>> ObtenerTodoAsync();
        Task<Respuesta<MedidaArticuloDTO>> ObtenerAsync(int id);
        Task<Respuesta<int>> InsertarAsync(MedidaArticuloCrearDTO dto);
        Task<Respuesta<bool>> ActualizarAsync(int id, MedidaArticuloActualizarDTO dto);
        Task<Respuesta<bool>> EliminarAsync(int id);
    }
}
