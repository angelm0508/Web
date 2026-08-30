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

        public Task<Respuesta<ImpuestoDTO>> ObtenerAsync(string codigo) =>
            GetAsync<ImpuestoDTO>($"{Recurso}/{codigo}");

        public Task<Respuesta<IEnumerable<ImpuestoDTO>>> ObtenerContenganNombreAsync(string nombre) =>
            GetAsync<IEnumerable<ImpuestoDTO>>($"{Recurso}/ContengaNombre/{Uri.EscapeDataString(nombre)}");
    }
}
