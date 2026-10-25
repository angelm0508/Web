using Web.ApiClient.Dtos;
using Web.ApiClient.Dtos.PagoEfectuado;

namespace Web.ApiClient.Clientes
{
    public class PagoEfectuadoApiClient : ApiClientBase, IPagoEfectuadoApiClient
    {
        private const string Recurso = "api/PagoEfectuado";

        public PagoEfectuadoApiClient(HttpClient http) : base(http) { }

        public Task<Respuesta<IEnumerable<PagoEfectuadoDTO>>> ObtenerTodoAsync() =>
            GetAsync<IEnumerable<PagoEfectuadoDTO>>(Recurso);

        public Task<Respuesta<PagoEfectuadoDTO>> ObtenerAsync(int entry) =>
            GetAsync<PagoEfectuadoDTO>($"{Recurso}/{entry}");

        public Task<Respuesta<IEnumerable<PagoEfectuadoFacturaDTO>>> ObtenerFacturasAsync(int entry) =>
            GetAsync<IEnumerable<PagoEfectuadoFacturaDTO>>($"{Recurso}/{entry}/Facturas");

        public Task<Respuesta<IEnumerable<PagoEfectuadoMedioDTO>>> ObtenerMediosAsync(int entry) =>
            GetAsync<IEnumerable<PagoEfectuadoMedioDTO>>($"{Recurso}/{entry}/Medios");

        public Task<Respuesta<IEnumerable<DocumentoPorPagarDTO>>> ObtenerDocumentosPorPagarAsync(string codigoSn) =>
            GetAsync<IEnumerable<DocumentoPorPagarDTO>>($"{Recurso}/FacturasAbiertas/{Uri.EscapeDataString(codigoSn)}");

        public Task<Respuesta<int>> InsertarAsync(PagoEfectuadoCrearDTO dto) =>
            PostAsync<int>(Recurso, dto);

        public Task<Respuesta<bool>> CancelarAsync(int entry) =>
            PostAsync<bool>($"{Recurso}/{entry}/Cancelar", new { });
    }
}
