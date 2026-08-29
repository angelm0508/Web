using Web.ApiClient.Dtos;
using Web.ApiClient.Dtos.Factura;

namespace Web.ApiClient.Clientes
{
    public class FacturaApiClient : ApiClientBase, IFacturaApiClient
    {
        private const string Recurso = "api/Factura";

        public FacturaApiClient(HttpClient http) : base(http) { }

        public Task<Respuesta<IEnumerable<FacturaDTO>>> ObtenerTodoAsync() =>
            GetAsync<IEnumerable<FacturaDTO>>(Recurso);

        public Task<Respuesta<FacturaDTO>> ObtenerAsync(int entry) =>
            GetAsync<FacturaDTO>($"{Recurso}/{entry}");

        public Task<Respuesta<int>> InsertarAsync(FacturaCrearDTO dto) =>
            PostAsync<int>(Recurso, dto);

        public Task<Respuesta<bool>> ActualizarAsync(int entry, FacturaActualizarDTO dto) =>
            PutAsync<bool>($"{Recurso}/{entry}", dto);

        public Task<Respuesta<bool>> EliminarAsync(int entry) =>
            DeleteAsync<bool>($"{Recurso}/{entry}");
    }
}
