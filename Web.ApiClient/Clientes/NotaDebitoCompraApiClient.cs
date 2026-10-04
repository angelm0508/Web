using Web.ApiClient.Dtos;
using Web.ApiClient.Dtos.NotaDebitoCompra;

namespace Web.ApiClient.Clientes
{
    public class NotaDebitoCompraApiClient : ApiClientBase, INotaDebitoCompraApiClient
    {
        private const string Recurso = "api/NotaDebitoCompra";

        public NotaDebitoCompraApiClient(HttpClient http) : base(http) { }

        public Task<Respuesta<IEnumerable<NotaDebitoCompraDTO>>> ObtenerTodoAsync() =>
            GetAsync<IEnumerable<NotaDebitoCompraDTO>>(Recurso);

        public Task<Respuesta<NotaDebitoCompraDTO>> ObtenerAsync(int entry) =>
            GetAsync<NotaDebitoCompraDTO>($"{Recurso}/{entry}");

        public Task<Respuesta<int>> InsertarAsync(NotaDebitoCompraCrearDTO dto) =>
            PostAsync<int>(Recurso, dto);

        public Task<Respuesta<bool>> ActualizarAsync(int entry, NotaDebitoCompraActualizarDTO dto) =>
            PutAsync<bool>($"{Recurso}/{entry}", dto);

        public Task<Respuesta<bool>> EliminarAsync(int entry) =>
            DeleteAsync<bool>($"{Recurso}/{entry}");

        public Task<Respuesta<IEnumerable<NotaDebitoCompraDetalleDTO>>> ObtenerLineasAsync(int entry) =>
            GetAsync<IEnumerable<NotaDebitoCompraDetalleDTO>>($"{Recurso}/{entry}/Lineas");

        public Task<Respuesta<IEnumerable<NotaDebitoCompraFacturaBaseResumenDTO>>> ObtenerFacturasCompraBaseAsync(string codigoSn) =>
            GetAsync<IEnumerable<NotaDebitoCompraFacturaBaseResumenDTO>>($"{Recurso}/FacturasCompraBase/{Uri.EscapeDataString(codigoSn)}");

        public Task<Respuesta<NotaDebitoCompraFacturaBaseDTO>> ObtenerFacturaCompraBaseAsync(int entry) =>
            GetAsync<NotaDebitoCompraFacturaBaseDTO>($"{Recurso}/FacturaCompraBase/{entry}");
    }
}
