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
    }
}
