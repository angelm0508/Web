using Web.ApiClient.Dtos;
using Web.ApiClient.Dtos.Permiso;

namespace Web.ApiClient.Clientes
{
    public class ModuloApiClient : ApiClientBase, IModuloApiClient
    {
        private const string Recurso = "api/Modulo";

        public ModuloApiClient(HttpClient http) : base(http) { }

        public Task<Respuesta<IEnumerable<ModuloDTO>>> ObtenerTodoAsync() =>
            GetAsync<IEnumerable<ModuloDTO>>(Recurso);
    }
}
