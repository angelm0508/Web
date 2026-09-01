using Web.ApiClient.Dtos;
using Web.ApiClient.Dtos.SalidaMercanciaDetalle;

namespace Web.ApiClient.Clientes
{
    public class SalidaMercanciaDetalleApiClient : ApiClientBase, ISalidaMercanciaDetalleApiClient
    {
        private const string Recurso = "api/SalidaMercanciaDetalle";

        public SalidaMercanciaDetalleApiClient(HttpClient http) : base(http) { }

        public Task<Respuesta<IEnumerable<SalidaMercanciaDetalleDTO>>> ObtenerTodoAsync() =>
            GetAsync<IEnumerable<SalidaMercanciaDetalleDTO>>(Recurso);

        public Task<Respuesta<IEnumerable<SalidaMercanciaDetalleDTO>>> ObtenerPorSalidaMercanciaAsync(int entry) =>
            GetAsync<IEnumerable<SalidaMercanciaDetalleDTO>>($"{Recurso}/PorSalidaMercancia/{entry}");

        public Task<Respuesta<SalidaMercanciaDetalleDTO>> ObtenerAsync(int entry, int noLinea) =>
            GetAsync<SalidaMercanciaDetalleDTO>($"{Recurso}/{entry}/{noLinea}");

        public Task<Respuesta<int>> InsertarAsync(SalidaMercanciaDetalleCrearDTO dto) =>
            PostAsync<int>(Recurso, dto);

        public Task<Respuesta<bool>> EliminarAsync(int entry, int noLinea) =>
            DeleteAsync<bool>($"{Recurso}/{entry}/{noLinea}");
    }
}
