using Web.ApiClient.Dtos;
using Web.ApiClient.Dtos.NumeracionDocumentoDet;

namespace Web.ApiClient.Clientes
{
    public class NumeracionDocumentoDetApiClient : ApiClientBase, INumeracionDocumentoDetApiClient
    {
        private const string Recurso = "api/NumeracionDocumentoDet";

        public NumeracionDocumentoDetApiClient(HttpClient http) : base(http) { }

        public Task<Respuesta<IEnumerable<NumeracionDocumentoDetDTO>>> ObtenerTodoAsync() =>
            GetAsync<IEnumerable<NumeracionDocumentoDetDTO>>(Recurso);

        public Task<Respuesta<IEnumerable<NumeracionDocumentoDetDTO>>> ObtenerPorDocumentoAsync(string codigoObj) =>
            GetAsync<IEnumerable<NumeracionDocumentoDetDTO>>($"{Recurso}/PorDocumento/{codigoObj}");

        public Task<Respuesta<NumeracionDocumentoDetDTO>> ObtenerAsync(int serie) =>
            GetAsync<NumeracionDocumentoDetDTO>($"{Recurso}/{serie}");

        public Task<Respuesta<int>> InsertarAsync(NumeracionDocumentoDetCrearDTO dto) =>
            PostAsync<int>(Recurso, dto);

        public Task<Respuesta<bool>> ActualizarAsync(int serie, NumeracionDocumentoDetActualizarDTO dto) =>
            PutAsync<bool>($"{Recurso}/{serie}", dto);

        public Task<Respuesta<bool>> EliminarAsync(int serie) =>
            DeleteAsync<bool>($"{Recurso}/{serie}");

        public Task<Respuesta<string>> GenerarCodigoAsync(int serie) =>
            PostAsync<string>($"{Recurso}/GenerarCodigo/{serie}", new { });
    }
}
