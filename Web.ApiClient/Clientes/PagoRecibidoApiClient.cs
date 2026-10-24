using Web.ApiClient.Dtos;
using Web.ApiClient.Dtos.PagoRecibido;

namespace Web.ApiClient.Clientes
{
    public class PagoRecibidoApiClient : ApiClientBase, IPagoRecibidoApiClient
    {
        private const string Recurso = "api/PagoRecibido";

        public PagoRecibidoApiClient(HttpClient http) : base(http) { }

        public Task<Respuesta<IEnumerable<PagoRecibidoDTO>>> ObtenerTodoAsync() =>
            GetAsync<IEnumerable<PagoRecibidoDTO>>(Recurso);

        public Task<Respuesta<PagoRecibidoDTO>> ObtenerAsync(int entry) =>
            GetAsync<PagoRecibidoDTO>($"{Recurso}/{entry}");

        public Task<Respuesta<IEnumerable<PagoRecibidoFacturaDTO>>> ObtenerFacturasAsync(int entry) =>
            GetAsync<IEnumerable<PagoRecibidoFacturaDTO>>($"{Recurso}/{entry}/Facturas");

        public Task<Respuesta<IEnumerable<PagoRecibidoMedioDTO>>> ObtenerMediosAsync(int entry) =>
            GetAsync<IEnumerable<PagoRecibidoMedioDTO>>($"{Recurso}/{entry}/Medios");

        public Task<Respuesta<IEnumerable<DocumentoPorCobrarDTO>>> ObtenerDocumentosPorCobrarAsync(string codigoSn) =>
            GetAsync<IEnumerable<DocumentoPorCobrarDTO>>($"{Recurso}/FacturasAbiertas/{Uri.EscapeDataString(codigoSn)}");

        public Task<Respuesta<int>> InsertarAsync(PagoRecibidoCrearDTO dto) =>
            PostAsync<int>(Recurso, dto);

        public Task<Respuesta<bool>> CancelarAsync(int entry) =>
            PostAsync<bool>($"{Recurso}/{entry}/Cancelar", new { });
    }
}
