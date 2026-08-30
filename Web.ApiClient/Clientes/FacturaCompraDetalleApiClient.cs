using Web.ApiClient.Dtos;
using Web.ApiClient.Dtos.FacturaCompraDetalle;

namespace Web.ApiClient.Clientes
{
    public class FacturaCompraDetalleApiClient : ApiClientBase, IFacturaCompraDetalleApiClient
    {
        private const string Recurso = "api/FacturaCompraDetalle";

        public FacturaCompraDetalleApiClient(HttpClient http) : base(http) { }

        public Task<Respuesta<IEnumerable<FacturaCompraDetalleDTO>>> ObtenerTodoAsync() =>
            GetAsync<IEnumerable<FacturaCompraDetalleDTO>>(Recurso);

        public Task<Respuesta<IEnumerable<FacturaCompraDetalleDTO>>> ObtenerPorFacturaCompraAsync(int entry) =>
            GetAsync<IEnumerable<FacturaCompraDetalleDTO>>($"{Recurso}/PorFacturaCompra/{entry}");

        public Task<Respuesta<FacturaCompraDetalleDTO>> ObtenerAsync(int entry, int noLinea) =>
            GetAsync<FacturaCompraDetalleDTO>($"{Recurso}/{entry}/{noLinea}");

        public Task<Respuesta<int>> InsertarAsync(FacturaCompraDetalleCrearDTO dto) =>
            PostAsync<int>(Recurso, dto);

        public Task<Respuesta<bool>> ActualizarAsync(int entry, int noLinea, FacturaCompraDetalleActualizarDTO dto) =>
            PutAsync<bool>($"{Recurso}/{entry}/{noLinea}", dto);

        public Task<Respuesta<bool>> EliminarAsync(int entry, int noLinea) =>
            DeleteAsync<bool>($"{Recurso}/{entry}/{noLinea}");
    }
}
