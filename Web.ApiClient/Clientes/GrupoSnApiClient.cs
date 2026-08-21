using Web.ApiClient.Dtos;
using Web.ApiClient.Dtos.GrupoSn;

namespace Web.ApiClient.Clientes
{
    public class GrupoSnApiClient : ApiClientBase, IGrupoSnApiClient
    {
        private const string Recurso = "api/GrupoSN";

        public GrupoSnApiClient(HttpClient http) : base(http) { }

        public Task<Respuesta<IEnumerable<GrupoSnDTO>>> ObtenerTodoAsync() =>
            GetAsync<IEnumerable<GrupoSnDTO>>(Recurso);

        public Task<Respuesta<GrupoSnDTO>> ObtenerAsync(int id) =>
            GetAsync<GrupoSnDTO>($"{Recurso}/{id}");

        public Task<Respuesta<int>> InsertarAsync(GrupoSnCrearDTO dto) =>
            PostAsync<int>(Recurso, dto);

        public Task<Respuesta<bool>> ActualizarAsync(int id, GrupoSnActualizarDTO dto) =>
            PutAsync<bool>($"{Recurso}/{id}", dto);

        public Task<Respuesta<bool>> EliminarAsync(int id) =>
            DeleteAsync<bool>($"{Recurso}/{id}");
    }
}
