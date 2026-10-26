using Web.ApiClient.Dtos;
using Web.ApiClient.Dtos.CondicionPago;

namespace Web.ApiClient.Clientes
{
    public class CondicionPagoApiClient : ApiClientBase, ICondicionPagoApiClient
    {
        private const string Recurso = "api/CondicionPago";

        public CondicionPagoApiClient(HttpClient http) : base(http) { }

        public Task<Respuesta<IEnumerable<CondicionPagoDTO>>> ObtenerTodoAsync() =>
            GetAsync<IEnumerable<CondicionPagoDTO>>(Recurso);

        public Task<Respuesta<CondicionPagoDTO>> ObtenerAsync(string codigo) =>
            GetAsync<CondicionPagoDTO>($"{Recurso}/{Uri.EscapeDataString(codigo)}");

        public Task<Respuesta<bool>> InsertarAsync(CondicionPagoCrearDTO dto) =>
            PostAsync<bool>(Recurso, dto);

        public Task<Respuesta<bool>> ActualizarAsync(string codigo, CondicionPagoActualizarDTO dto) =>
            PutAsync<bool>($"{Recurso}/{Uri.EscapeDataString(codigo)}", dto);

        public Task<Respuesta<bool>> EliminarAsync(string codigo) =>
            DeleteAsync<bool>($"{Recurso}/{Uri.EscapeDataString(codigo)}");
    }
}
