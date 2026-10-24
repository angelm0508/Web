using Web.ApiClient.Dtos;
using Web.ApiClient.Dtos.SaldoFactura;

namespace Web.ApiClient.Clientes
{
    public interface ISaldoFacturaApiClient
    {
        Task<Respuesta<IEnumerable<SaldoFacturaDTO>>> ObtenerSaldosFacturasAsync(IEnumerable<int> entries);
        Task<Respuesta<IEnumerable<SaldoFacturaDTO>>> ObtenerSaldosNotasDebitoAsync(IEnumerable<int> entries);
    }
}
