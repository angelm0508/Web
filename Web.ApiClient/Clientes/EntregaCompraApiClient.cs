using Web.ApiClient.Dtos;
using Web.ApiClient.Dtos.EntregaCompra;

namespace Web.ApiClient.Clientes
{
    public class EntregaCompraApiClient : ApiClientBase, IEntregaCompraApiClient
    {
        private const string Recurso = "api/EntregaCompra";

        public EntregaCompraApiClient(HttpClient http) : base(http) { }

        public Task<Respuesta<IEnumerable<EntregaCompraDTO>>> ObtenerTodoAsync() =>
            GetAsync<IEnumerable<EntregaCompraDTO>>(Recurso);

        public Task<Respuesta<EntregaCompraDTO>> ObtenerAsync(int entry) =>
            GetAsync<EntregaCompraDTO>($"{Recurso}/{entry}");

        public Task<Respuesta<int>> InsertarAsync(EntregaCompraCrearDTO dto) =>
            PostAsync<int>(Recurso, dto);

        public Task<Respuesta<bool>> ActualizarAsync(int entry, EntregaCompraActualizarDTO dto) =>
            PutAsync<bool>($"{Recurso}/{entry}", dto);

        public Task<Respuesta<bool>> EliminarAsync(int entry) =>
            DeleteAsync<bool>($"{Recurso}/{entry}");
    }
}
