using Web.ApiClient.Dtos;
using Web.ApiClient.Dtos.PedidoCompra;

namespace Web.ApiClient.Clientes
{
    public class PedidoCompraApiClient : ApiClientBase, IPedidoCompraApiClient
    {
        private const string Recurso = "api/PedidoCompra";

        public PedidoCompraApiClient(HttpClient http) : base(http) { }

        public Task<Respuesta<IEnumerable<PedidoCompraDTO>>> ObtenerTodoAsync() =>
            GetAsync<IEnumerable<PedidoCompraDTO>>(Recurso);

        public Task<Respuesta<PedidoCompraDTO>> ObtenerAsync(int entry) =>
            GetAsync<PedidoCompraDTO>($"{Recurso}/{entry}");

        public Task<Respuesta<int>> InsertarAsync(PedidoCompraCrearDTO dto) =>
            PostAsync<int>(Recurso, dto);

        public Task<Respuesta<bool>> ActualizarAsync(int entry, PedidoCompraActualizarDTO dto) =>
            PutAsync<bool>($"{Recurso}/{entry}", dto);

        public Task<Respuesta<bool>> EliminarAsync(int entry) =>
            DeleteAsync<bool>($"{Recurso}/{entry}");
    }
}
