using Web.ApiClient.Dtos;
using Web.ApiClient.Dtos.Existencia;

namespace Web.ApiClient.Clientes
{
    public interface IExistenciaApiClient
    {
        Task<Respuesta<IEnumerable<ExistenciaArticuloDTO>>> ObtenerTodoAsync(string? articulo = null, string? almacen = null);
        Task<Respuesta<IEnumerable<ExistenciaArticuloDTO>>> ObtenerPorArticuloAsync(string codArticulo);
    }
}
