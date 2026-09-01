using Web.ApiClient.Dtos;
using Web.ApiClient.Dtos.EntradaMercancia;

namespace Web.ApiClient.Clientes
{
    public class EntradaMercanciaApiClient : ApiClientBase, IEntradaMercanciaApiClient
    {
        private const string Recurso = "api/EntradaMercancia";

        public EntradaMercanciaApiClient(HttpClient http) : base(http) { }

        public Task<Respuesta<IEnumerable<EntradaMercanciaDTO>>> ObtenerTodoAsync() =>
            GetAsync<IEnumerable<EntradaMercanciaDTO>>(Recurso);

        public Task<Respuesta<EntradaMercanciaDTO>> ObtenerAsync(int entry) =>
            GetAsync<EntradaMercanciaDTO>($"{Recurso}/{entry}");

        public Task<Respuesta<int>> InsertarAsync(EntradaMercanciaCrearDTO dto) =>
            PostAsync<int>(Recurso, dto);

        public Task<Respuesta<bool>> ActualizarAsync(int entry, EntradaMercanciaActualizarDTO dto) =>
            PutAsync<bool>($"{Recurso}/{entry}", dto);

        public Task<Respuesta<bool>> EliminarAsync(int entry) =>
            DeleteAsync<bool>($"{Recurso}/{entry}");
    }
}
