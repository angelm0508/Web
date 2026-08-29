using Web.ApiClient.Dtos;
using Web.ApiClient.Dtos.NumeracionDocumentoDet;

namespace Web.ApiClient.Clientes
{
    public interface INumeracionDocumentoDetApiClient
    {
        Task<Respuesta<IEnumerable<NumeracionDocumentoDetDTO>>> ObtenerTodoAsync();
        Task<Respuesta<IEnumerable<NumeracionDocumentoDetDTO>>> ObtenerPorDocumentoAsync(string codigoObj);
        Task<Respuesta<NumeracionDocumentoDetDTO>> ObtenerAsync(int serie);
        Task<Respuesta<int>> InsertarAsync(NumeracionDocumentoDetCrearDTO dto);
        Task<Respuesta<bool>> ActualizarAsync(int serie, NumeracionDocumentoDetActualizarDTO dto);
        Task<Respuesta<bool>> EliminarAsync(int serie);
        Task<Respuesta<string>> GenerarCodigoAsync(int serie);
    }
}
