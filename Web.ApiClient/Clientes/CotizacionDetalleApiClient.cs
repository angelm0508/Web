using Web.ApiClient.Dtos;
using Web.ApiClient.Dtos.CotizacionDetalle;

namespace Web.ApiClient.Clientes
{
    public class CotizacionDetalleApiClient : ApiClientBase, ICotizacionDetalleApiClient
    {
        private const string Recurso = "api/CotizacionDetalle";

        public CotizacionDetalleApiClient(HttpClient http) : base(http) { }

        public Task<Respuesta<IEnumerable<CotizacionDetalleDTO>>> ObtenerTodoAsync() =>
            GetAsync<IEnumerable<CotizacionDetalleDTO>>(Recurso);

        public Task<Respuesta<IEnumerable<CotizacionDetalleDTO>>> ObtenerPorCotizacionAsync(int entry) =>
            GetAsync<IEnumerable<CotizacionDetalleDTO>>($"{Recurso}/PorCotizacion/{entry}");

        public Task<Respuesta<CotizacionDetalleDTO>> ObtenerAsync(int entry, int noLinea) =>
            GetAsync<CotizacionDetalleDTO>($"{Recurso}/{entry}/{noLinea}");

        public Task<Respuesta<int>> InsertarAsync(CotizacionDetalleCrearDTO dto) =>
            PostAsync<int>(Recurso, dto);

        public Task<Respuesta<bool>> ActualizarAsync(int entry, int noLinea, CotizacionDetalleActualizarDTO dto) =>
            PutAsync<bool>($"{Recurso}/{entry}/{noLinea}", dto);

        public Task<Respuesta<bool>> EliminarAsync(int entry, int noLinea) =>
            DeleteAsync<bool>($"{Recurso}/{entry}/{noLinea}");
    }
}
