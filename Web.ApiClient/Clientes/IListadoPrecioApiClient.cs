using Web.ApiClient.Dtos;
using Web.ApiClient.Dtos.ListadoPrecio;

namespace Web.ApiClient.Clientes
{
    public interface IListadoPrecioApiClient
    {
        Task<Respuesta<IEnumerable<ListadoPrecioDTO>>> ObtenerTodoAsync();
        Task<Respuesta<ListadoPrecioDTO>> ObtenerAsync(int id);
        Task<Respuesta<int>> InsertarAsync(ListadoPrecioCrearDTO dto);
        Task<Respuesta<bool>> ActualizarAsync(int id, ListadoPrecioActualizarDTO dto);
        Task<Respuesta<bool>> EliminarAsync(int id);
    }
}
