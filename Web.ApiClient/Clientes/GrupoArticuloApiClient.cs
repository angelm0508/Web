using Web.ApiClient.Dtos;
using Web.ApiClient.Dtos.GrupoArticulo;

namespace Web.ApiClient.Clientes
{
    public class GrupoArticuloApiClient : ApiClientBase, IGrupoArticuloApiClient
    {
        private const string Recurso = "api/GrupoArticulo";

        public GrupoArticuloApiClient(HttpClient http) : base(http) { }

        public Task<Respuesta<IEnumerable<GrupoArticuloDTO>>> ObtenerTodoAsync() =>
            GetAsync<IEnumerable<GrupoArticuloDTO>>(Recurso);

        public Task<Respuesta<GrupoArticuloDTO>> ObtenerAsync(int id) =>
            GetAsync<GrupoArticuloDTO>($"{Recurso}/{id}");

        public Task<Respuesta<int>> InsertarAsync(GrupoArticuloCrearDTO dto) =>
            PostAsync<int>(Recurso, dto);

        public Task<Respuesta<bool>> ActualizarAsync(int id, GrupoArticuloActualizarDTO dto) =>
            PutAsync<bool>($"{Recurso}/{id}", dto);

        public Task<Respuesta<bool>> EliminarAsync(int id) =>
            DeleteAsync<bool>($"{Recurso}/{id}");
    }
}
