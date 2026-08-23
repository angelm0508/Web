using Web.ApiClient.Dtos;
using Web.ApiClient.Dtos.UnidadMedidaArticulo;

namespace Web.ApiClient.Clientes
{
    public class UnidadMedidaArticuloApiClient : ApiClientBase, IUnidadMedidaArticuloApiClient
    {
        private const string Recurso = "api/UnidadMedidaArticulo";

        public UnidadMedidaArticuloApiClient(HttpClient http) : base(http) { }

        public Task<Respuesta<IEnumerable<UnidadMedidaArticuloDTO>>> ObtenerTodoAsync() =>
            GetAsync<IEnumerable<UnidadMedidaArticuloDTO>>(Recurso);

        public Task<Respuesta<UnidadMedidaArticuloDTO>> ObtenerAsync(int id) =>
            GetAsync<UnidadMedidaArticuloDTO>($"{Recurso}/{id}");

        public Task<Respuesta<int>> InsertarAsync(UnidadMedidaArticuloCrearDTO dto) =>
            PostAsync<int>(Recurso, dto);

        public Task<Respuesta<bool>> ActualizarAsync(int id, UnidadMedidaArticuloActualizarDTO dto) =>
            PutAsync<bool>($"{Recurso}/{id}", dto);

        public Task<Respuesta<bool>> EliminarAsync(int id) =>
            DeleteAsync<bool>($"{Recurso}/{id}");
    }
}
