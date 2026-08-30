using Web.ApiClient.Dtos;
using Web.ApiClient.Dtos.Impuesto;

namespace Web.ApiClient.Clientes
{
    public interface IImpuestoApiClient
    {
        Task<Respuesta<IEnumerable<ImpuestoDTO>>> ObtenerTodoAsync();
        Task<Respuesta<ImpuestoDTO>> ObtenerAsync(string codigo);
        Task<Respuesta<IEnumerable<ImpuestoDTO>>> ObtenerContenganNombreAsync(string nombre);
    }
}
