using Web.ApiClient.Dtos;
using Web.ApiClient.Dtos.Mecanico;

namespace Web.ApiClient.Clientes
{
    public interface IMecanicoApiClient
    {
        Task<Respuesta<IEnumerable<MecanicoDTO>>> ObtenerTodoAsync();
        Task<Respuesta<MecanicoDTO>> ObtenerAsync(string codigo);
        Task<Respuesta<bool>> InsertarAsync(MecanicoCrearDTO dto);
        Task<Respuesta<bool>> ActualizarAsync(string codigo, MecanicoActualizarDTO dto);
        Task<Respuesta<bool>> EliminarAsync(string codigo);
    }
}
