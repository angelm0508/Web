using Web.ApiClient.Dtos;
using Web.ApiClient.Dtos.NumeracionDocumento;

namespace Web.ApiClient.Clientes
{
    public interface INumeracionDocumentoApiClient
    {
        Task<Respuesta<IEnumerable<NumeracionDocumentoDTO>>> ObtenerTodoAsync();
        Task<Respuesta<NumeracionDocumentoDTO>> ObtenerAsync(string codigo);
        Task<Respuesta<bool>> InsertarAsync(NumeracionDocumentoCrearDTO dto);
        Task<Respuesta<bool>> ActualizarAsync(string codigo, NumeracionDocumentoActualizarDTO dto);
        Task<Respuesta<bool>> EliminarAsync(string codigo);
    }
}
