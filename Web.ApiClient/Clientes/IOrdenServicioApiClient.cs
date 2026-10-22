using Web.ApiClient.Dtos;
using Web.ApiClient.Dtos.OrdenServicio;

namespace Web.ApiClient.Clientes
{
    public interface IOrdenServicioApiClient
    {
        Task<Respuesta<IEnumerable<OrdenServicioDTO>>> ObtenerTodoAsync(string? estado = null);
        Task<Respuesta<OrdenServicioDTO>> ObtenerAsync(int entry);
        Task<Respuesta<int>> InsertarAsync(OrdenServicioCrearDTO dto);
        Task<Respuesta<bool>> ActualizarAsync(int entry, OrdenServicioActualizarDTO dto);
        Task<Respuesta<bool>> CambiarEstadoAsync(int entry, string estado);
        Task<Respuesta<bool>> CancelarAsync(int entry);
        Task<Respuesta<IEnumerable<OrdenServicioDetalleDTO>>> ObtenerLineasAsync(int entry);
    }
}
