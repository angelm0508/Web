using Web.ApiClient.Dtos;
using Web.ApiClient.Dtos.SaldoFactura;

namespace Web.ApiClient.Clientes
{
    public class SaldoFacturaApiClient : ApiClientBase, ISaldoFacturaApiClient
    {
        public SaldoFacturaApiClient(HttpClient http) : base(http) { }

        public Task<Respuesta<IEnumerable<SaldoFacturaDTO>>> ObtenerSaldosFacturasAsync(IEnumerable<int> entries) =>
            PostAsync<IEnumerable<SaldoFacturaDTO>>("api/Factura/Saldos", entries.ToList());

        public Task<Respuesta<IEnumerable<SaldoFacturaDTO>>> ObtenerSaldosNotasDebitoAsync(IEnumerable<int> entries) =>
            PostAsync<IEnumerable<SaldoFacturaDTO>>("api/NotaDebito/Saldos", entries.ToList());
    }
}
