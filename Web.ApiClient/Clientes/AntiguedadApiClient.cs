using Web.ApiClient.Dtos;
using Web.ApiClient.Dtos.Antiguedad;

namespace Web.ApiClient.Clientes
{
    public class AntiguedadApiClient : ApiClientBase, IAntiguedadApiClient
    {
        private const string Recurso = "api/Antiguedad";

        public AntiguedadApiClient(HttpClient http) : base(http) { }

        public Task<Respuesta<List<FilaAntiguedadDTO>>> ObtenerCobrarAsync() =>
            GetAsync<List<FilaAntiguedadDTO>>($"{Recurso}/Cobrar");

        public Task<Respuesta<List<DocumentoAntiguedadDTO>>> ObtenerDetalleCobrarAsync(string codigoSn) =>
            GetAsync<List<DocumentoAntiguedadDTO>>($"{Recurso}/Cobrar/{Uri.EscapeDataString(codigoSn)}");

        public Task<Respuesta<List<FilaAntiguedadDTO>>> ObtenerPagarAsync() =>
            GetAsync<List<FilaAntiguedadDTO>>($"{Recurso}/Pagar");

        public Task<Respuesta<List<DocumentoAntiguedadDTO>>> ObtenerDetallePagarAsync(string codigoSn) =>
            GetAsync<List<DocumentoAntiguedadDTO>>($"{Recurso}/Pagar/{Uri.EscapeDataString(codigoSn)}");
    }
}
