using Web.ApiClient.Dtos;
using Web.ApiClient.Dtos.DireccionSocioNegocio;

namespace Web.ApiClient.Clientes
{
    public interface IDireccionSocioNegocioApiClient
    {
        Task<Respuesta<IEnumerable<DireccionSocioNegocioDTO>>> ObtenerTodoAsync();
        Task<Respuesta<DireccionSocioNegocioDTO>> ObtenerAsync(string direccion);
        Task<Respuesta<bool>> InsertarAsync(DireccionSocioNegocioCrearDTO dto);
        Task<Respuesta<bool>> ActualizarAsync(string direccion, DireccionSocioNegocioActualizarDTO dto);
        Task<Respuesta<bool>> EliminarAsync(string direccion);
    }
}
