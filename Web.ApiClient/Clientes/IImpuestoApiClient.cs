using Web.ApiClient.Dtos;
using Web.ApiClient.Dtos.Impuesto;

namespace Web.ApiClient.Clientes
{
    // Solo lectura, usado como fuente de dropdown (CodigoImpuesto en el detalle de Cotizaciones).
    public interface IImpuestoApiClient
    {
        Task<Respuesta<IEnumerable<ImpuestoDTO>>> ObtenerTodoAsync();
    }
}
