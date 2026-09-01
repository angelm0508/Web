using Web.ApiClient.Dtos;
using Web.ApiClient.Dtos.EntradaMercanciaDetalle;

namespace Web.ApiClient.Clientes
{
    public class EntradaMercanciaDetalleApiClient : ApiClientBase, IEntradaMercanciaDetalleApiClient
    {
        private const string Recurso = "api/EntradaMercanciaDetalle";

        public EntradaMercanciaDetalleApiClient(HttpClient http) : base(http) { }

        public Task<Respuesta<IEnumerable<EntradaMercanciaDetalleDTO>>> ObtenerTodoAsync() =>
            GetAsync<IEnumerable<EntradaMercanciaDetalleDTO>>(Recurso);

        public Task<Respuesta<IEnumerable<EntradaMercanciaDetalleDTO>>> ObtenerPorEntradaMercanciaAsync(int entry) =>
            GetAsync<IEnumerable<EntradaMercanciaDetalleDTO>>($"{Recurso}/PorEntradaMercancia/{entry}");

        public Task<Respuesta<EntradaMercanciaDetalleDTO>> ObtenerAsync(int entry, int noLinea) =>
            GetAsync<EntradaMercanciaDetalleDTO>($"{Recurso}/{entry}/{noLinea}");

        public Task<Respuesta<int>> InsertarAsync(EntradaMercanciaDetalleCrearDTO dto) =>
            PostAsync<int>(Recurso, dto);

        public Task<Respuesta<bool>> EliminarAsync(int entry, int noLinea) =>
            DeleteAsync<bool>($"{Recurso}/{entry}/{noLinea}");
    }
}
