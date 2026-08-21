using Web.ApiClient.Dtos;
using Web.ApiClient.Dtos.MedidaArticulo;

namespace Web.ApiClient.Clientes
{
    public class MedidaArticuloApiClient : ApiClientBase, IMedidaArticuloApiClient
    {
        private const string Recurso = "api/MedidaArticulo";

        public MedidaArticuloApiClient(HttpClient http) : base(http) { }

        public Task<Respuesta<IEnumerable<MedidaArticuloDTO>>> ObtenerTodoAsync() =>
            GetAsync<IEnumerable<MedidaArticuloDTO>>(Recurso);

        public Task<Respuesta<MedidaArticuloDTO>> ObtenerAsync(int id) =>
            GetAsync<MedidaArticuloDTO>($"{Recurso}/{id}");

        public Task<Respuesta<int>> InsertarAsync(MedidaArticuloCrearDTO dto) =>
            PostAsync<int>(Recurso, dto);

        public Task<Respuesta<bool>> ActualizarAsync(int id, MedidaArticuloActualizarDTO dto) =>
            PutAsync<bool>($"{Recurso}/{id}", dto);

        public Task<Respuesta<bool>> EliminarAsync(int id) =>
            DeleteAsync<bool>($"{Recurso}/{id}");
    }
}
