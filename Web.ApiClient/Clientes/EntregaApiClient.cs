using Web.ApiClient.Dtos;
using Web.ApiClient.Dtos.Entrega;

namespace Web.ApiClient.Clientes
{
    public class EntregaApiClient : ApiClientBase, IEntregaApiClient
    {
        private const string Recurso = "api/Entrega";

        public EntregaApiClient(HttpClient http) : base(http) { }

        public Task<Respuesta<IEnumerable<EntregaDTO>>> ObtenerTodoAsync() =>
            GetAsync<IEnumerable<EntregaDTO>>(Recurso);

        public Task<Respuesta<EntregaDTO>> ObtenerAsync(int entry) =>
            GetAsync<EntregaDTO>($"{Recurso}/{entry}");

        public Task<Respuesta<int>> InsertarAsync(EntregaCrearDTO dto) =>
            PostAsync<int>(Recurso, dto);

        public Task<Respuesta<bool>> ActualizarAsync(int entry, EntregaActualizarDTO dto) =>
            PutAsync<bool>($"{Recurso}/{entry}", dto);

        public Task<Respuesta<bool>> EliminarAsync(int entry) =>
            DeleteAsync<bool>($"{Recurso}/{entry}");
    }
}
