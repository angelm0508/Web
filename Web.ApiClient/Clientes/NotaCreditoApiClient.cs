using Web.ApiClient.Dtos;
using Web.ApiClient.Dtos.NotaCredito;

namespace Web.ApiClient.Clientes
{
    public class NotaCreditoApiClient : ApiClientBase, INotaCreditoApiClient
    {
        private const string Recurso = "api/NotaCredito";

        public NotaCreditoApiClient(HttpClient http) : base(http) { }

        public Task<Respuesta<IEnumerable<NotaCreditoDTO>>> ObtenerTodoAsync() =>
            GetAsync<IEnumerable<NotaCreditoDTO>>(Recurso);

        public Task<Respuesta<NotaCreditoDTO>> ObtenerAsync(int entry) =>
            GetAsync<NotaCreditoDTO>($"{Recurso}/{entry}");

        public Task<Respuesta<int>> InsertarAsync(NotaCreditoCrearDTO dto) =>
            PostAsync<int>(Recurso, dto);

        public Task<Respuesta<bool>> ActualizarAsync(int entry, NotaCreditoActualizarDTO dto) =>
            PutAsync<bool>($"{Recurso}/{entry}", dto);

        public Task<Respuesta<bool>> EliminarAsync(int entry) =>
            DeleteAsync<bool>($"{Recurso}/{entry}");

        public Task<Respuesta<IEnumerable<NotaCreditoDetalleDTO>>> ObtenerLineasAsync(int entry) =>
            GetAsync<IEnumerable<NotaCreditoDetalleDTO>>($"{Recurso}/{entry}/Lineas");

        public Task<Respuesta<IEnumerable<NotaCreditoFacturaBaseResumenDTO>>> ObtenerFacturasBaseAsync(string codigoSn) =>
            GetAsync<IEnumerable<NotaCreditoFacturaBaseResumenDTO>>($"{Recurso}/FacturasBase/{Uri.EscapeDataString(codigoSn)}");

        public Task<Respuesta<NotaCreditoFacturaBaseDTO>> ObtenerFacturaBaseAsync(int entry) =>
            GetAsync<NotaCreditoFacturaBaseDTO>($"{Recurso}/FacturaBase/{entry}");
    }
}
