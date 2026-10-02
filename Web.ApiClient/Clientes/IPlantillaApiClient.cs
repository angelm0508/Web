using Web.ApiClient.Dtos;
using Web.ApiClient.Dtos.Permiso;

namespace Web.ApiClient.Clientes
{
    public interface IPlantillaApiClient
    {
        Task<Respuesta<IEnumerable<PlantillaDTO>>> ObtenerTodoAsync();
        Task<Respuesta<PlantillaDTO>> ObtenerAsync(int id);
        Task<Respuesta<int>> InsertarAsync(PlantillaCrearDTO dto);
        Task<Respuesta<bool>> ActualizarAsync(int id, PlantillaActualizarDTO dto);
        Task<Respuesta<bool>> EliminarAsync(int id);
        Task<Respuesta<IEnumerable<PermisoModuloDTO>>> ObtenerPermisosAsync(int id);
        Task<Respuesta<bool>> GuardarPermisosAsync(int id, List<PermisoModuloDTO> matriz);
    }
}
