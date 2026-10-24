using Web.ApiClient.Dtos;
using Web.ApiClient.Dtos.FormaPago;

namespace Web.ApiClient.Clientes
{
    public interface IFormaPagoApiClient
    {
        Task<Respuesta<IEnumerable<FormaPagoDTO>>> ObtenerTodoAsync();
        Task<Respuesta<FormaPagoDTO>> ObtenerAsync(string codigo);
        Task<Respuesta<bool>> InsertarAsync(FormaPagoCrearDTO dto);
        Task<Respuesta<bool>> ActualizarAsync(string codigo, FormaPagoActualizarDTO dto);
        Task<Respuesta<bool>> EliminarAsync(string codigo);
    }
}
