using Web.ApiClient.Dtos;
using Web.ApiClient.Dtos.Articulo;

namespace Web.ApiClient.Clientes
{
    public interface IArticuloApiClient
    {
        Task<Respuesta<IEnumerable<ArticuloDTO>>> ObtenerTodoAsync();
        Task<Respuesta<ArticuloDTO>> ObtenerAsync(string codigo);
        Task<Respuesta<string>> InsertarAsync(ArticuloCrearDTO dto);
        Task<Respuesta<bool>> ActualizarAsync(string codigo, ArticuloActualizarDTO dto);
        Task<Respuesta<bool>> EliminarAsync(string codigo);
        Task<Respuesta<IEnumerable<ArticuloDTO>>> ObtenerContenganNombreAsync(string nombre);
    }
}
