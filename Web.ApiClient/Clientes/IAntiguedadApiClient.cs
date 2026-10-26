using Web.ApiClient.Dtos;
using Web.ApiClient.Dtos.Antiguedad;

namespace Web.ApiClient.Clientes
{
    public interface IAntiguedadApiClient
    {
        Task<Respuesta<List<FilaAntiguedadDTO>>> ObtenerCobrarAsync();
        Task<Respuesta<List<DocumentoAntiguedadDTO>>> ObtenerDetalleCobrarAsync(string codigoSn);
        Task<Respuesta<List<FilaAntiguedadDTO>>> ObtenerPagarAsync();
        Task<Respuesta<List<DocumentoAntiguedadDTO>>> ObtenerDetallePagarAsync(string codigoSn);
    }
}
