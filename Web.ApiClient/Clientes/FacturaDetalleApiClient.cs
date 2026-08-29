using Web.ApiClient.Dtos;
using Web.ApiClient.Dtos.FacturaDetalle;

namespace Web.ApiClient.Clientes
{
    public class FacturaDetalleApiClient : ApiClientBase, IFacturaDetalleApiClient
    {
        private const string Recurso = "api/FacturaDetalle";

        public FacturaDetalleApiClient(HttpClient http) : base(http) { }

        public Task<Respuesta<IEnumerable<FacturaDetalleDTO>>> ObtenerTodoAsync() =>
            GetAsync<IEnumerable<FacturaDetalleDTO>>(Recurso);

        public Task<Respuesta<IEnumerable<FacturaDetalleDTO>>> ObtenerPorFacturaAsync(int entry) =>
            GetAsync<IEnumerable<FacturaDetalleDTO>>($"{Recurso}/PorFactura/{entry}");

        public Task<Respuesta<FacturaDetalleDTO>> ObtenerAsync(int entry, int noLinea) =>
            GetAsync<FacturaDetalleDTO>($"{Recurso}/{entry}/{noLinea}");

        public Task<Respuesta<int>> InsertarAsync(FacturaDetalleCrearDTO dto) =>
            PostAsync<int>(Recurso, dto);

        public Task<Respuesta<bool>> ActualizarAsync(int entry, int noLinea, FacturaDetalleActualizarDTO dto) =>
            PutAsync<bool>($"{Recurso}/{entry}/{noLinea}", dto);

        public Task<Respuesta<bool>> EliminarAsync(int entry, int noLinea) =>
            DeleteAsync<bool>($"{Recurso}/{entry}/{noLinea}");
    }
}
