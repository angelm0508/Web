using Web.ApiClient.Dtos;
using Web.ApiClient.Dtos.Usuario;

namespace Web.ApiClient.Clientes
{
    public class UsuarioApiClient : ApiClientBase, IUsuarioApiClient
    {
        private const string Recurso = "api/Usuario";

        public UsuarioApiClient(HttpClient http) : base(http) { }

        public Task<Respuesta<IEnumerable<UsuarioDTO>>> ObtenerTodoAsync() =>
            GetAsync<IEnumerable<UsuarioDTO>>(Recurso);

        public Task<Respuesta<UsuarioDTO>> ObtenerAsync(int id) =>
            GetAsync<UsuarioDTO>($"{Recurso}/{id}");

        public Task<Respuesta<int>> InsertarAsync(UsuarioCrearDTO dto) =>
            PostAsync<int>(Recurso, dto);

        public Task<Respuesta<bool>> ActualizarAsync(int id, UsuarioActualizarDTO dto) =>
            PutAsync<bool>($"{Recurso}/{id}", dto);

        public Task<Respuesta<bool>> EliminarAsync(int id) =>
            DeleteAsync<bool>($"{Recurso}/{id}");
    }
}
