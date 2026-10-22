using Web.ApiClient.Dtos;
using Web.ApiClient.Dtos.Mecanico;

namespace Web.ApiClient.Clientes
{
    public class MecanicoApiClient : ApiClientBase, IMecanicoApiClient
    {
        private const string Recurso = "api/Mecanico";

        public MecanicoApiClient(HttpClient http) : base(http) { }

        public Task<Respuesta<IEnumerable<MecanicoDTO>>> ObtenerTodoAsync() =>
            GetAsync<IEnumerable<MecanicoDTO>>(Recurso);

        public Task<Respuesta<MecanicoDTO>> ObtenerAsync(string codigo) =>
            GetAsync<MecanicoDTO>($"{Recurso}/{Uri.EscapeDataString(codigo)}");

        public Task<Respuesta<bool>> InsertarAsync(MecanicoCrearDTO dto) =>
            PostAsync<bool>(Recurso, dto);

        public Task<Respuesta<bool>> ActualizarAsync(string codigo, MecanicoActualizarDTO dto) =>
            PutAsync<bool>($"{Recurso}/{Uri.EscapeDataString(codigo)}", dto);

        public Task<Respuesta<bool>> EliminarAsync(string codigo) =>
            DeleteAsync<bool>($"{Recurso}/{Uri.EscapeDataString(codigo)}");
    }
}
