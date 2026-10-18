using Web.ApiClient.Dtos;
using Web.ApiClient.Dtos.DocumentoBase;

namespace Web.ApiClient.Clientes
{
    public class DocumentoBaseApiClient : ApiClientBase, IDocumentoBaseApiClient
    {
        private const string Recurso = "api/DocumentoBase";

        public DocumentoBaseApiClient(HttpClient http) : base(http) { }

        public Task<Respuesta<DocumentoBaseBorradorDTO>> ObtenerBorradorAsync(int tipoOrigen, int entry, int tipoDestino) =>
            GetAsync<DocumentoBaseBorradorDTO>($"{Recurso}/{tipoOrigen}/{entry}/Abierto?destino={tipoDestino}");
    }
}
