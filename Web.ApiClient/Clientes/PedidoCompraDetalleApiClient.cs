using Web.ApiClient.Dtos;
using Web.ApiClient.Dtos.PedidoCompraDetalle;

namespace Web.ApiClient.Clientes
{
    public class PedidoCompraDetalleApiClient : ApiClientBase, IPedidoCompraDetalleApiClient
    {
        private const string Recurso = "api/PedidoCompraDetalle";

        public PedidoCompraDetalleApiClient(HttpClient http) : base(http) { }

        public Task<Respuesta<IEnumerable<PedidoCompraDetalleDTO>>> ObtenerTodoAsync() =>
            GetAsync<IEnumerable<PedidoCompraDetalleDTO>>(Recurso);

        public Task<Respuesta<IEnumerable<PedidoCompraDetalleDTO>>> ObtenerPorPedidoCompraAsync(int entry) =>
            GetAsync<IEnumerable<PedidoCompraDetalleDTO>>($"{Recurso}/PorPedidoCompra/{entry}");

        public Task<Respuesta<PedidoCompraDetalleDTO>> ObtenerAsync(int entry, int noLinea) =>
            GetAsync<PedidoCompraDetalleDTO>($"{Recurso}/{entry}/{noLinea}");

        public Task<Respuesta<int>> InsertarAsync(PedidoCompraDetalleCrearDTO dto) =>
            PostAsync<int>(Recurso, dto);

        public Task<Respuesta<bool>> ActualizarAsync(int entry, int noLinea, PedidoCompraDetalleActualizarDTO dto) =>
            PutAsync<bool>($"{Recurso}/{entry}/{noLinea}", dto);

        public Task<Respuesta<bool>> EliminarAsync(int entry, int noLinea) =>
            DeleteAsync<bool>($"{Recurso}/{entry}/{noLinea}");
    }
}
