using Web.ApiClient.Dtos;
using Web.ApiClient.Dtos.Permiso;

namespace Web.ApiClient.Clientes
{
    public interface IModuloApiClient
    {
        Task<Respuesta<IEnumerable<ModuloDTO>>> ObtenerTodoAsync();
    }
}
