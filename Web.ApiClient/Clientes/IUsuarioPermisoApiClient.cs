using Web.ApiClient.Dtos;
using Web.ApiClient.Dtos.Permiso;

namespace Web.ApiClient.Clientes
{
    public interface IUsuarioPermisoApiClient
    {
        Task<Respuesta<IEnumerable<PermisoModuloDTO>>> ObtenerAsync(int usuarioId);
        Task<Respuesta<bool>> GuardarAsync(int usuarioId, List<PermisoModuloDTO> matriz);
        Task<Respuesta<bool>> AplicarPlantillaAsync(int usuarioId, int plantillaId);
    }
}
