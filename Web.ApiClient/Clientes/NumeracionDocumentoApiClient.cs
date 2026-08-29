using Web.ApiClient.Dtos;
using Web.ApiClient.Dtos.NumeracionDocumento;

namespace Web.ApiClient.Clientes
{
    public class NumeracionDocumentoApiClient : ApiClientBase, INumeracionDocumentoApiClient
    {
        private const string Recurso = "api/NumeracionDocumento";

        public NumeracionDocumentoApiClient(HttpClient http) : base(http) { }

        public Task<Respuesta<IEnumerable<NumeracionDocumentoDTO>>> ObtenerTodoAsync() =>
            GetAsync<IEnumerable<NumeracionDocumentoDTO>>(Recurso);

        public Task<Respuesta<NumeracionDocumentoDTO>> ObtenerAsync(string codigo) =>
            GetAsync<NumeracionDocumentoDTO>($"{Recurso}/{codigo}");

        public Task<Respuesta<bool>> InsertarAsync(NumeracionDocumentoCrearDTO dto) =>
            PostAsync<bool>(Recurso, dto);

        public Task<Respuesta<bool>> ActualizarAsync(string codigo, NumeracionDocumentoActualizarDTO dto) =>
            PutAsync<bool>($"{Recurso}/{codigo}", dto);

        public Task<Respuesta<bool>> EliminarAsync(string codigo) =>
            DeleteAsync<bool>($"{Recurso}/{codigo}");
    }
}
