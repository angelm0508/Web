using Web.ApiClient.Dtos;
using Web.ApiClient.Dtos.FacturaCompra;

namespace Web.ApiClient.Clientes
{
    public class FacturaCompraApiClient : ApiClientBase, IFacturaCompraApiClient
    {
        private const string Recurso = "api/FacturaCompra";

        public FacturaCompraApiClient(HttpClient http) : base(http) { }

        public Task<Respuesta<IEnumerable<FacturaCompraDTO>>> ObtenerTodoAsync() =>
            GetAsync<IEnumerable<FacturaCompraDTO>>(Recurso);

        public Task<Respuesta<FacturaCompraDTO>> ObtenerAsync(int entry) =>
            GetAsync<FacturaCompraDTO>($"{Recurso}/{entry}");

        public Task<Respuesta<int>> InsertarAsync(FacturaCompraCrearDTO dto) =>
            PostAsync<int>(Recurso, dto);

        public Task<Respuesta<bool>> ActualizarAsync(int entry, FacturaCompraActualizarDTO dto) =>
            PutAsync<bool>($"{Recurso}/{entry}", dto);

        public Task<Respuesta<bool>> EliminarAsync(int entry) =>
            DeleteAsync<bool>($"{Recurso}/{entry}");
    }
}
