using Web.ApiClient.Dtos;
using Web.ApiClient.Dtos.PedidoDetalle;

namespace Web.ApiClient.Clientes
{
    public class PedidoDetalleApiClient : ApiClientBase, IPedidoDetalleApiClient
    {
        private const string Recurso = "api/PedidoDetalle";

        public PedidoDetalleApiClient(HttpClient http) : base(http) { }

        public Task<Respuesta<IEnumerable<PedidoDetalleDTO>>> ObtenerTodoAsync() =>
            GetAsync<IEnumerable<PedidoDetalleDTO>>(Recurso);

        public Task<Respuesta<IEnumerable<PedidoDetalleDTO>>> ObtenerPorPedidoAsync(int entry) =>
            GetAsync<IEnumerable<PedidoDetalleDTO>>($"{Recurso}/PorPedido/{entry}");

        public Task<Respuesta<PedidoDetalleDTO>> ObtenerAsync(int entry, int noLinea) =>
            GetAsync<PedidoDetalleDTO>($"{Recurso}/{entry}/{noLinea}");

        public Task<Respuesta<int>> InsertarAsync(PedidoDetalleCrearDTO dto) =>
            PostAsync<int>(Recurso, dto);

        public Task<Respuesta<bool>> ActualizarAsync(int entry, int noLinea, PedidoDetalleActualizarDTO dto) =>
            PutAsync<bool>($"{Recurso}/{entry}/{noLinea}", dto);

        public Task<Respuesta<bool>> EliminarAsync(int entry, int noLinea) =>
            DeleteAsync<bool>($"{Recurso}/{entry}/{noLinea}");
    }
}
