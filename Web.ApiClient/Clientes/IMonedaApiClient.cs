using Web.ApiClient.Dtos;
using Web.ApiClient.Dtos.Moneda;

namespace Web.ApiClient.Clientes
{
    // Solo lectura, usado como fuente de dropdown (MonedaDoc en Cotizaciones).
    public interface IMonedaApiClient
    {
        Task<Respuesta<IEnumerable<MonedaDTO>>> ObtenerTodoAsync();
    }
}
