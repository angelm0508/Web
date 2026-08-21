using Web.ApiClient.Dtos;
using Web.ApiClient.Dtos.FabricanteArticulo;

namespace Web.ApiClient.Clientes
{
    public interface IFabricanteArticuloApiClient
    {
        Task<Respuesta<IEnumerable<FabricanteArticuloDTO>>> ObtenerTodoAsync();
        Task<Respuesta<FabricanteArticuloDTO>> ObtenerAsync(int id);
        Task<Respuesta<int>> InsertarAsync(FabricanteArticuloCrearDTO dto);
        Task<Respuesta<bool>> ActualizarAsync(int id, FabricanteArticuloActualizarDTO dto);
        Task<Respuesta<bool>> EliminarAsync(int id);
    }
}
