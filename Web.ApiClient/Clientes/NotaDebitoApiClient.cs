using Web.ApiClient.Dtos;
using Web.ApiClient.Dtos.NotaDebito;

namespace Web.ApiClient.Clientes
{
    public class NotaDebitoApiClient : ApiClientBase, INotaDebitoApiClient
    {
        private const string Recurso = "api/NotaDebito";

        public NotaDebitoApiClient(HttpClient http) : base(http) { }

        public Task<Respuesta<IEnumerable<NotaDebitoDTO>>> ObtenerTodoAsync() =>
            GetAsync<IEnumerable<NotaDebitoDTO>>(Recurso);

        public Task<Respuesta<NotaDebitoDTO>> ObtenerAsync(int entry) =>
            GetAsync<NotaDebitoDTO>($"{Recurso}/{entry}");

        public Task<Respuesta<int>> InsertarAsync(NotaDebitoCrearDTO dto) =>
            PostAsync<int>(Recurso, dto);

        public Task<Respuesta<bool>> ActualizarAsync(int entry, NotaDebitoActualizarDTO dto) =>
            PutAsync<bool>($"{Recurso}/{entry}", dto);

        public Task<Respuesta<bool>> EliminarAsync(int entry) =>
            DeleteAsync<bool>($"{Recurso}/{entry}");

        public Task<Respuesta<IEnumerable<NotaDebitoDetalleDTO>>> ObtenerLineasAsync(int entry) =>
            GetAsync<IEnumerable<NotaDebitoDetalleDTO>>($"{Recurso}/{entry}/Lineas");

        public Task<Respuesta<IEnumerable<NotaDebitoFacturaBaseResumenDTO>>> ObtenerFacturasBaseAsync(string codigoSn) =>
            GetAsync<IEnumerable<NotaDebitoFacturaBaseResumenDTO>>($"{Recurso}/FacturasBase/{Uri.EscapeDataString(codigoSn)}");

        public Task<Respuesta<NotaDebitoFacturaBaseDTO>> ObtenerFacturaBaseAsync(int entry) =>
            GetAsync<NotaDebitoFacturaBaseDTO>($"{Recurso}/FacturaBase/{entry}");
    }
}
