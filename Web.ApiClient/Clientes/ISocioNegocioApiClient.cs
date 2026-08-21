using Web.ApiClient.Dtos;
using Web.ApiClient.Dtos.SocioNegocio;

namespace Web.ApiClient.Clientes
{
    public interface ISocioNegocioApiClient
    {
        Task<Respuesta<IEnumerable<SocioNegocioDTO>>> ObtenerTodoAsync();
        Task<Respuesta<SocioNegocioDTO>> ObtenerAsync(string codigo);
        Task<Respuesta<bool>> InsertarAsync(SocioNegocioCrearDTO dto);
        Task<Respuesta<bool>> ActualizarAsync(string codigo, SocioNegocioActualizarDTO dto);
        Task<Respuesta<bool>> EliminarAsync(string codigo);
    }
}
