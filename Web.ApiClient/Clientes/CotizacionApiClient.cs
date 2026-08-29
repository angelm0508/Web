using Web.ApiClient.Dtos;
using Web.ApiClient.Dtos.Cotizacion;

namespace Web.ApiClient.Clientes
{
    public class CotizacionApiClient : ApiClientBase, ICotizacionApiClient
    {
        private const string Recurso = "api/Cotizacion";

        public CotizacionApiClient(HttpClient http) : base(http) { }

        public Task<Respuesta<IEnumerable<CotizacionDTO>>> ObtenerTodoAsync() =>
            GetAsync<IEnumerable<CotizacionDTO>>(Recurso);

        public Task<Respuesta<CotizacionDTO>> ObtenerAsync(int entry) =>
            GetAsync<CotizacionDTO>($"{Recurso}/{entry}");

        public Task<Respuesta<int>> InsertarAsync(CotizacionCrearDTO dto) =>
            PostAsync<int>(Recurso, dto);

        public Task<Respuesta<bool>> ActualizarAsync(int entry, CotizacionActualizarDTO dto) =>
            PutAsync<bool>($"{Recurso}/{entry}", dto);

        public Task<Respuesta<bool>> EliminarAsync(int entry) =>
            DeleteAsync<bool>($"{Recurso}/{entry}");
    }
}
