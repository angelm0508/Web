using Web.ApiClient.Dtos;
using Web.ApiClient.Dtos.Municipio;

namespace Web.ApiClient.Clientes
{
    /// <summary>Solo lectura: fuente del dropdown en cascada "Municipio" (filtrado por Departamento+País en el cliente).</summary>
    public class MunicipioApiClient : ApiClientBase, IMunicipioApiClient
    {
        public MunicipioApiClient(HttpClient http) : base(http) { }

        public Task<Respuesta<IEnumerable<MunicipioDTO>>> ObtenerTodoAsync() =>
            GetAsync<IEnumerable<MunicipioDTO>>("api/Municipio");
    }
}
