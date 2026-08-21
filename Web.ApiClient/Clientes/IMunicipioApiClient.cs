using Web.ApiClient.Dtos;
using Web.ApiClient.Dtos.Municipio;

namespace Web.ApiClient.Clientes
{
    public interface IMunicipioApiClient
    {
        Task<Respuesta<IEnumerable<MunicipioDTO>>> ObtenerTodoAsync();
    }
}
