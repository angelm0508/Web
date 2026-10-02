using Web.ApiClient.Dtos;
using Web.ApiClient.Dtos.Permiso;

namespace Web.ApiClient.Clientes
{
    public class UsuarioPermisoApiClient : ApiClientBase, IUsuarioPermisoApiClient
    {
        private const string Recurso = "api/UsuarioPermiso";

        public UsuarioPermisoApiClient(HttpClient http) : base(http) { }

        public Task<Respuesta<IEnumerable<PermisoModuloDTO>>> ObtenerAsync(int usuarioId) =>
            GetAsync<IEnumerable<PermisoModuloDTO>>($"{Recurso}/{usuarioId}");

        public Task<Respuesta<bool>> GuardarAsync(int usuarioId, List<PermisoModuloDTO> matriz) =>
            PutAsync<bool>($"{Recurso}/{usuarioId}", matriz);

        public Task<Respuesta<bool>> AplicarPlantillaAsync(int usuarioId, int plantillaId) =>
            PostAsync<bool>($"{Recurso}/{usuarioId}/AplicarPlantilla/{plantillaId}", new { });
    }
}
