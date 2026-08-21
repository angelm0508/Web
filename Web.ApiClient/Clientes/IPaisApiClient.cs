using Web.ApiClient.Dtos;
using Web.ApiClient.Dtos.Pais;

namespace Web.ApiClient.Clientes
{
    public interface IPaisApiClient
    {
        Task<Respuesta<IEnumerable<PaisDTO>>> ObtenerTodoAsync();
    }
}
