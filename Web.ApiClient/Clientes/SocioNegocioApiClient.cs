using Web.ApiClient.Dtos;
using Web.ApiClient.Dtos.SocioNegocio;

namespace Web.ApiClient.Clientes
{
    public class SocioNegocioApiClient : ApiClientBase, ISocioNegocioApiClient
    {
        private const string Recurso = "api/SocioNegocio";

        public SocioNegocioApiClient(HttpClient http) : base(http) { }

        public Task<Respuesta<IEnumerable<SocioNegocioDTO>>> ObtenerTodoAsync(string? tipo = null) =>
            GetAsync<IEnumerable<SocioNegocioDTO>>(tipo is null ? Recurso : $"{Recurso}?tipo={Uri.EscapeDataString(tipo)}");

        public Task<Respuesta<SocioNegocioDTO>> ObtenerAsync(string codigo) =>
            GetAsync<SocioNegocioDTO>($"{Recurso}/{codigo}");

        public Task<Respuesta<string>> InsertarAsync(SocioNegocioCrearDTO dto) =>
            PostAsync<string>(Recurso, dto);

        public Task<Respuesta<bool>> ActualizarAsync(string codigo, SocioNegocioActualizarDTO dto) =>
            PutAsync<bool>($"{Recurso}/{codigo}", dto);

        public Task<Respuesta<bool>> EliminarAsync(string codigo) =>
            DeleteAsync<bool>($"{Recurso}/{codigo}");

        public Task<Respuesta<IEnumerable<SocioNegocioDTO>>> ObtenerContenganNombreAsync(string nombre, string? tipo = null)
        {
            var url = $"{Recurso}/ContengaNombre/{Uri.EscapeDataString(nombre)}";
            if (tipo is not null) url += $"?tipo={Uri.EscapeDataString(tipo)}";
            return GetAsync<IEnumerable<SocioNegocioDTO>>(url);
        }
    }
}
