using Web.ApiClient.Dtos;
using Web.ApiClient.Dtos.FormaPago;

namespace Web.ApiClient.Clientes
{
    public class FormaPagoApiClient : ApiClientBase, IFormaPagoApiClient
    {
        private const string Recurso = "api/FormaPago";

        public FormaPagoApiClient(HttpClient http) : base(http) { }

        public Task<Respuesta<IEnumerable<FormaPagoDTO>>> ObtenerTodoAsync() =>
            GetAsync<IEnumerable<FormaPagoDTO>>(Recurso);

        public Task<Respuesta<FormaPagoDTO>> ObtenerAsync(string codigo) =>
            GetAsync<FormaPagoDTO>($"{Recurso}/{Uri.EscapeDataString(codigo)}");

        public Task<Respuesta<bool>> InsertarAsync(FormaPagoCrearDTO dto) =>
            PostAsync<bool>(Recurso, dto);

        public Task<Respuesta<bool>> ActualizarAsync(string codigo, FormaPagoActualizarDTO dto) =>
            PutAsync<bool>($"{Recurso}/{Uri.EscapeDataString(codigo)}", dto);

        public Task<Respuesta<bool>> EliminarAsync(string codigo) =>
            DeleteAsync<bool>($"{Recurso}/{Uri.EscapeDataString(codigo)}");
    }
}
