using Web.ApiClient.Dtos;
using Web.ApiClient.Dtos.SalidaMercancia;

namespace Web.ApiClient.Clientes
{
    public class SalidaMercanciaApiClient : ApiClientBase, ISalidaMercanciaApiClient
    {
        private const string Recurso = "api/SalidaMercancia";

        public SalidaMercanciaApiClient(HttpClient http) : base(http) { }

        public Task<Respuesta<IEnumerable<SalidaMercanciaDTO>>> ObtenerTodoAsync() =>
            GetAsync<IEnumerable<SalidaMercanciaDTO>>(Recurso);

        public Task<Respuesta<SalidaMercanciaDTO>> ObtenerAsync(int entry) =>
            GetAsync<SalidaMercanciaDTO>($"{Recurso}/{entry}");

        public Task<Respuesta<int>> InsertarAsync(SalidaMercanciaCrearDTO dto) =>
            PostAsync<int>(Recurso, dto);

        public Task<Respuesta<bool>> ActualizarAsync(int entry, SalidaMercanciaActualizarDTO dto) =>
            PutAsync<bool>($"{Recurso}/{entry}", dto);

        public Task<Respuesta<bool>> EliminarAsync(int entry) =>
            DeleteAsync<bool>($"{Recurso}/{entry}");
    }
}
