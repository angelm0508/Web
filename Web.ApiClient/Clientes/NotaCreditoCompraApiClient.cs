using Web.ApiClient.Dtos;
using Web.ApiClient.Dtos.NotaCreditoCompra;

namespace Web.ApiClient.Clientes
{
    public class NotaCreditoCompraApiClient : ApiClientBase, INotaCreditoCompraApiClient
    {
        private const string Recurso = "api/NotaCreditoCompra";

        public NotaCreditoCompraApiClient(HttpClient http) : base(http) { }

        public Task<Respuesta<IEnumerable<NotaCreditoCompraDTO>>> ObtenerTodoAsync() =>
            GetAsync<IEnumerable<NotaCreditoCompraDTO>>(Recurso);

        public Task<Respuesta<NotaCreditoCompraDTO>> ObtenerAsync(int entry) =>
            GetAsync<NotaCreditoCompraDTO>($"{Recurso}/{entry}");

        public Task<Respuesta<int>> InsertarAsync(NotaCreditoCompraCrearDTO dto) =>
            PostAsync<int>(Recurso, dto);

        public Task<Respuesta<bool>> ActualizarAsync(int entry, NotaCreditoCompraActualizarDTO dto) =>
            PutAsync<bool>($"{Recurso}/{entry}", dto);

        public Task<Respuesta<bool>> EliminarAsync(int entry) =>
            DeleteAsync<bool>($"{Recurso}/{entry}");

        public Task<Respuesta<IEnumerable<NotaCreditoCompraDetalleDTO>>> ObtenerLineasAsync(int entry) =>
            GetAsync<IEnumerable<NotaCreditoCompraDetalleDTO>>($"{Recurso}/{entry}/Lineas");

        public Task<Respuesta<IEnumerable<NotaCreditoCompraFacturaBaseResumenDTO>>> ObtenerFacturasCompraBaseAsync(string codigoSn) =>
            GetAsync<IEnumerable<NotaCreditoCompraFacturaBaseResumenDTO>>($"{Recurso}/FacturasCompraBase/{Uri.EscapeDataString(codigoSn)}");

        public Task<Respuesta<NotaCreditoCompraFacturaBaseDTO>> ObtenerFacturaCompraBaseAsync(int entry) =>
            GetAsync<NotaCreditoCompraFacturaBaseDTO>($"{Recurso}/FacturaCompraBase/{entry}");
    }
}
