using Web.ApiClient.Dtos;
using Web.ApiClient.Dtos.Moneda;

namespace Web.ApiClient.Clientes
{
    public class MonedaApiClient : ApiClientBase, IMonedaApiClient
    {
        private const string Recurso = "api/Moneda";

        public MonedaApiClient(HttpClient http) : base(http) { }

        public Task<Respuesta<IEnumerable<MonedaDTO>>> ObtenerTodoAsync() =>
            GetAsync<IEnumerable<MonedaDTO>>(Recurso);
    }
}
