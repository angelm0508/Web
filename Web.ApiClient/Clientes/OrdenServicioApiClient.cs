using Web.ApiClient.Dtos;
using Web.ApiClient.Dtos.OrdenServicio;

namespace Web.ApiClient.Clientes
{
    public class OrdenServicioApiClient : ApiClientBase, IOrdenServicioApiClient
    {
        private const string Recurso = "api/OrdenServicio";

        public OrdenServicioApiClient(HttpClient http) : base(http) { }

        public Task<Respuesta<IEnumerable<OrdenServicioDTO>>> ObtenerTodoAsync(string? estado = null) =>
            GetAsync<IEnumerable<OrdenServicioDTO>>(string.IsNullOrWhiteSpace(estado) ? Recurso : $"{Recurso}?estado={Uri.EscapeDataString(estado)}");

        public Task<Respuesta<OrdenServicioDTO>> ObtenerAsync(int entry) =>
            GetAsync<OrdenServicioDTO>($"{Recurso}/{entry}");

        public Task<Respuesta<int>> InsertarAsync(OrdenServicioCrearDTO dto) =>
            PostAsync<int>(Recurso, dto);

        public Task<Respuesta<bool>> ActualizarAsync(int entry, OrdenServicioActualizarDTO dto) =>
            PutAsync<bool>($"{Recurso}/{entry}", dto);

        public Task<Respuesta<bool>> CambiarEstadoAsync(int entry, string estado) =>
            PostAsync<bool>($"{Recurso}/{entry}/Estado", new OrdenServicioEstadoDTO { Estado = estado });

        public Task<Respuesta<bool>> CancelarAsync(int entry) =>
            PostAsync<bool>($"{Recurso}/{entry}/Cancelar", new { });

        public Task<Respuesta<IEnumerable<OrdenServicioDetalleDTO>>> ObtenerLineasAsync(int entry) =>
            GetAsync<IEnumerable<OrdenServicioDetalleDTO>>($"{Recurso}/{entry}/Lineas");
    }
}
