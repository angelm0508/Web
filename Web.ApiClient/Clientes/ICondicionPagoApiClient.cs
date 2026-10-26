using Web.ApiClient.Dtos;
using Web.ApiClient.Dtos.CondicionPago;

namespace Web.ApiClient.Clientes
{
    public interface ICondicionPagoApiClient
    {
        Task<Respuesta<IEnumerable<CondicionPagoDTO>>> ObtenerTodoAsync();
        Task<Respuesta<CondicionPagoDTO>> ObtenerAsync(string codigo);
        Task<Respuesta<bool>> InsertarAsync(CondicionPagoCrearDTO dto);
        Task<Respuesta<bool>> ActualizarAsync(string codigo, CondicionPagoActualizarDTO dto);
        Task<Respuesta<bool>> EliminarAsync(string codigo);
    }
}
