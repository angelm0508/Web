using Web.ApiClient.Dtos;
using Web.ApiClient.Dtos.Impuesto;

namespace Web.ApiClient.Clientes
{
    public class ImpuestoApiClient : ApiClientBase, IImpuestoApiClient
    {
        private const string Recurso = "api/Impuesto";

        public ImpuestoApiClient(HttpClient http) : base(http) { }

        public Task<Respuesta<IEnumerable<ImpuestoDTO>>> ObtenerTodoAsync() =>
            GetAsync<IEnumerable<ImpuestoDTO>>(Recurso);
    }
}
