using Web.ApiClient.Dtos;
using Web.ApiClient.Dtos.SaldoFacturaCompra;

namespace Web.ApiClient.Clientes
{
    public class SaldoFacturaCompraApiClient : ApiClientBase, ISaldoFacturaCompraApiClient
    {
        public SaldoFacturaCompraApiClient(HttpClient http) : base(http) { }

        public Task<Respuesta<IEnumerable<SaldoFacturaCompraDTO>>> ObtenerSaldosFacturasCompraAsync(IEnumerable<int> entries) =>
            PostAsync<IEnumerable<SaldoFacturaCompraDTO>>("api/FacturaCompra/Saldos", entries.ToList());

        public Task<Respuesta<IEnumerable<SaldoFacturaCompraDTO>>> ObtenerSaldosNotasDebitoCompraAsync(IEnumerable<int> entries) =>
            PostAsync<IEnumerable<SaldoFacturaCompraDTO>>("api/NotaDebitoCompra/Saldos", entries.ToList());
    }
}
