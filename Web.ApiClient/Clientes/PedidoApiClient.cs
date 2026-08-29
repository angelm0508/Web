using Web.ApiClient.Dtos;
using Web.ApiClient.Dtos.Pedido;

namespace Web.ApiClient.Clientes
{
    public class PedidoApiClient : ApiClientBase, IPedidoApiClient
    {
        private const string Recurso = "api/Pedido";

        public PedidoApiClient(HttpClient http) : base(http) { }

        public Task<Respuesta<IEnumerable<PedidoDTO>>> ObtenerTodoAsync() =>
            GetAsync<IEnumerable<PedidoDTO>>(Recurso);

        public Task<Respuesta<PedidoDTO>> ObtenerAsync(int entry) =>
            GetAsync<PedidoDTO>($"{Recurso}/{entry}");

        public Task<Respuesta<int>> InsertarAsync(PedidoCrearDTO dto) =>
            PostAsync<int>(Recurso, dto);

        public Task<Respuesta<bool>> ActualizarAsync(int entry, PedidoActualizarDTO dto) =>
            PutAsync<bool>($"{Recurso}/{entry}", dto);

        public Task<Respuesta<bool>> EliminarAsync(int entry) =>
            DeleteAsync<bool>($"{Recurso}/{entry}");
    }
}
