using Web.ApiClient.Dtos;
using Web.ApiClient.Dtos.Departamento;

namespace Web.ApiClient.Clientes
{
    /// <summary>Solo lectura: fuente del dropdown en cascada "Departamento" (filtrado por País en el cliente).</summary>
    public class DepartamentoApiClient : ApiClientBase, IDepartamentoApiClient
    {
        public DepartamentoApiClient(HttpClient http) : base(http) { }

        public Task<Respuesta<IEnumerable<DepartamentoDTO>>> ObtenerTodoAsync() =>
            GetAsync<IEnumerable<DepartamentoDTO>>("api/Departamento");
    }
}
