using Web.ApiClient.Dtos;
using Web.ApiClient.Dtos.Departamento;

namespace Web.ApiClient.Clientes
{
    public interface IDepartamentoApiClient
    {
        Task<Respuesta<IEnumerable<DepartamentoDTO>>> ObtenerTodoAsync();
    }
}
