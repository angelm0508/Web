using Web.ApiClient.Dtos;
using Web.ApiClient.Dtos.SocioNegocio;

namespace Web.ApiClient.Clientes
{
    public class SocioNegocioApiClient : ApiClientBase, ISocioNegocioApiClient
    {
        private const string Recurso = "api/SocioNegocio";

        public SocioNegocioApiClient(HttpClient http) : base(http) { }

        public Task<Respuesta<IEnumerable<SocioNegocioDTO>>> ObtenerTodoAsync() =>
            GetAsync<IEnumerable<SocioNegocioDTO>>(Recurso);

        public Task<Respuesta<SocioNegocioDTO>> ObtenerAsync(string codigo) =>
            GetAsync<SocioNegocioDTO>($"{Recurso}/{codigo}");

        public Task<Respuesta<string>> InsertarAsync(SocioNegocioCrearDTO dto) =>
            PostAsync<string>(Recurso, dto);

        public Task<Respuesta<bool>> ActualizarAsync(string codigo, SocioNegocioActualizarDTO dto) =>
            PutAsync<bool>($"{Recurso}/{codigo}", dto);

        public Task<Respuesta<bool>> EliminarAsync(string codigo) =>
            DeleteAsync<bool>($"{Recurso}/{codigo}");

        public Task<Respuesta<IEnumerable<SocioNegocioDTO>>> ObtenerContenganNombreAsync(string nombre) =>
            GetAsync<IEnumerable<SocioNegocioDTO>>($"{Recurso}/ContengaNombre/{Uri.EscapeDataString(nombre)}");
    }
}
