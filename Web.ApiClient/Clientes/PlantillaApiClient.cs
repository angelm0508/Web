using Web.ApiClient.Dtos;
using Web.ApiClient.Dtos.Permiso;

namespace Web.ApiClient.Clientes
{
    public class PlantillaApiClient : ApiClientBase, IPlantillaApiClient
    {
        private const string Recurso = "api/Plantilla";

        public PlantillaApiClient(HttpClient http) : base(http) { }

        public Task<Respuesta<IEnumerable<PlantillaDTO>>> ObtenerTodoAsync() =>
            GetAsync<IEnumerable<PlantillaDTO>>(Recurso);

        public Task<Respuesta<PlantillaDTO>> ObtenerAsync(int id) =>
            GetAsync<PlantillaDTO>($"{Recurso}/{id}");

        public Task<Respuesta<int>> InsertarAsync(PlantillaCrearDTO dto) =>
            PostAsync<int>(Recurso, dto);

        public Task<Respuesta<bool>> ActualizarAsync(int id, PlantillaActualizarDTO dto) =>
            PutAsync<bool>($"{Recurso}/{id}", dto);

        public Task<Respuesta<bool>> EliminarAsync(int id) =>
            DeleteAsync<bool>($"{Recurso}/{id}");

        public Task<Respuesta<IEnumerable<PermisoModuloDTO>>> ObtenerPermisosAsync(int id) =>
            GetAsync<IEnumerable<PermisoModuloDTO>>($"{Recurso}/{id}/Permisos");

        public Task<Respuesta<bool>> GuardarPermisosAsync(int id, List<PermisoModuloDTO> matriz) =>
            PutAsync<bool>($"{Recurso}/{id}/Permisos", matriz);
    }
}
