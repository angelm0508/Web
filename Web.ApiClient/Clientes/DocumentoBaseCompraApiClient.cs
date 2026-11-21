using Web.ApiClient.Dtos;
using Web.ApiClient.Dtos.DocumentoBase;

namespace Web.ApiClient.Clientes
{
    public class DocumentoBaseCompraApiClient : ApiClientBase, IDocumentoBaseCompraApiClient
    {
        private const string Recurso = "api/DocumentoBaseCompra";

        public DocumentoBaseCompraApiClient(HttpClient http) : base(http) { }

        public Task<Respuesta<DocumentoBaseBorradorDTO>> ObtenerBorradorAsync(int tipoOrigen, int entry, int tipoDestino) =>
            GetAsync<DocumentoBaseBorradorDTO>($"{Recurso}/{tipoOrigen}/{entry}/Abierto?destino={tipoDestino}");
    }
}
