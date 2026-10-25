using Web.ApiClient.Dtos;
using Web.ApiClient.Dtos.SaldoFacturaCompra;

namespace Web.ApiClient.Clientes
{
    public interface ISaldoFacturaCompraApiClient
    {
        Task<Respuesta<IEnumerable<SaldoFacturaCompraDTO>>> ObtenerSaldosFacturasCompraAsync(IEnumerable<int> entries);
        Task<Respuesta<IEnumerable<SaldoFacturaCompraDTO>>> ObtenerSaldosNotasDebitoCompraAsync(IEnumerable<int> entries);
    }
}
