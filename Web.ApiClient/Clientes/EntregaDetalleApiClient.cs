using Web.ApiClient.Dtos;
using Web.ApiClient.Dtos.EntregaDetalle;

namespace Web.ApiClient.Clientes
{
    public class EntregaDetalleApiClient : ApiClientBase, IEntregaDetalleApiClient
    {
        private const string Recurso = "api/EntregaDetalle";

        public EntregaDetalleApiClient(HttpClient http) : base(http) { }

        public Task<Respuesta<IEnumerable<EntregaDetalleDTO>>> ObtenerTodoAsync() =>
            GetAsync<IEnumerable<EntregaDetalleDTO>>(Recurso);

        public Task<Respuesta<IEnumerable<EntregaDetalleDTO>>> ObtenerPorEntregaAsync(int entry) =>
            GetAsync<IEnumerable<EntregaDetalleDTO>>($"{Recurso}/PorEntrega/{entry}");

        public Task<Respuesta<EntregaDetalleDTO>> ObtenerAsync(int entry, int noLinea) =>
            GetAsync<EntregaDetalleDTO>($"{Recurso}/{entry}/{noLinea}");

        public Task<Respuesta<int>> InsertarAsync(EntregaDetalleCrearDTO dto) =>
            PostAsync<int>(Recurso, dto);

        public Task<Respuesta<bool>> ActualizarAsync(int entry, int noLinea, EntregaDetalleActualizarDTO dto) =>
            PutAsync<bool>($"{Recurso}/{entry}/{noLinea}", dto);

        public Task<Respuesta<bool>> EliminarAsync(int entry, int noLinea) =>
            DeleteAsync<bool>($"{Recurso}/{entry}/{noLinea}");
    }
}
