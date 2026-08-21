using Web.ApiClient.Dtos;
using Web.ApiClient.Dtos.DireccionSocioNegocio;

namespace Web.ApiClient.Clientes
{
    public class DireccionSocioNegocioApiClient : ApiClientBase, IDireccionSocioNegocioApiClient
    {
        private const string Recurso = "api/DireccionSocioNegocio";

        public DireccionSocioNegocioApiClient(HttpClient http) : base(http) { }

        public Task<Respuesta<IEnumerable<DireccionSocioNegocioDTO>>> ObtenerTodoAsync() =>
            GetAsync<IEnumerable<DireccionSocioNegocioDTO>>(Recurso);

        public Task<Respuesta<DireccionSocioNegocioDTO>> ObtenerAsync(string direccion) =>
            GetAsync<DireccionSocioNegocioDTO>($"{Recurso}/{direccion}");

        public Task<Respuesta<bool>> InsertarAsync(DireccionSocioNegocioCrearDTO dto) =>
            PostAsync<bool>(Recurso, dto);

        public Task<Respuesta<bool>> ActualizarAsync(string direccion, DireccionSocioNegocioActualizarDTO dto) =>
            PutAsync<bool>($"{Recurso}/{direccion}", dto);

        public Task<Respuesta<bool>> EliminarAsync(string direccion) =>
            DeleteAsync<bool>($"{Recurso}/{direccion}");
    }
}
