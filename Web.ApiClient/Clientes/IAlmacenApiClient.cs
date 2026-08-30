using Web.ApiClient.Dtos;
using Web.ApiClient.Dtos.Almacen;

namespace Web.ApiClient.Clientes
{
    public interface IAlmacenApiClient
    {
        Task<Respuesta<IEnumerable<AlmacenDTO>>> ObtenerTodoAsync();
        Task<Respuesta<AlmacenDTO>> ObtenerAsync(string codigo);
        Task<Respuesta<bool>> InsertarAsync(AlmacenCrearDTO dto);
        Task<Respuesta<bool>> ActualizarAsync(string codigo, AlmacenActualizarDTO dto);
        Task<Respuesta<bool>> EliminarAsync(string codigo);
        Task<Respuesta<IEnumerable<AlmacenDTO>>> ObtenerContenganNombreAsync(string nombre);
    }
}
