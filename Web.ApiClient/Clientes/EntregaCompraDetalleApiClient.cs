using Web.ApiClient.Dtos;
using Web.ApiClient.Dtos.EntregaCompraDetalle;

namespace Web.ApiClient.Clientes
{
    public class EntregaCompraDetalleApiClient : ApiClientBase, IEntregaCompraDetalleApiClient
    {
        private const string Recurso = "api/EntregaCompraDetalle";

        public EntregaCompraDetalleApiClient(HttpClient http) : base(http) { }

        public Task<Respuesta<IEnumerable<EntregaCompraDetalleDTO>>> ObtenerTodoAsync() =>
            GetAsync<IEnumerable<EntregaCompraDetalleDTO>>(Recurso);

        public Task<Respuesta<IEnumerable<EntregaCompraDetalleDTO>>> ObtenerPorEntregaCompraAsync(int entry) =>
            GetAsync<IEnumerable<EntregaCompraDetalleDTO>>($"{Recurso}/PorEntregaCompra/{entry}");

        public Task<Respuesta<EntregaCompraDetalleDTO>> ObtenerAsync(int entry, int noLinea) =>
            GetAsync<EntregaCompraDetalleDTO>($"{Recurso}/{entry}/{noLinea}");

        public Task<Respuesta<int>> InsertarAsync(EntregaCompraDetalleCrearDTO dto) =>
            PostAsync<int>(Recurso, dto);

        public Task<Respuesta<bool>> ActualizarAsync(int entry, int noLinea, EntregaCompraDetalleActualizarDTO dto) =>
            PutAsync<bool>($"{Recurso}/{entry}/{noLinea}", dto);

        public Task<Respuesta<bool>> EliminarAsync(int entry, int noLinea) =>
            DeleteAsync<bool>($"{Recurso}/{entry}/{noLinea}");
    }
}
