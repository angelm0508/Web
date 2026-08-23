using Web.ApiClient.Dtos;
using Web.ApiClient.Dtos.GrupoUnidadMedidaArticulo;

namespace Web.ApiClient.Clientes
{
    public class GrupoUnidadMedidaArticuloApiClient : ApiClientBase, IGrupoUnidadMedidaArticuloApiClient
    {
        private const string Recurso = "api/GrupoUnidadMedidaArticulo";

        public GrupoUnidadMedidaArticuloApiClient(HttpClient http) : base(http) { }

        public Task<Respuesta<IEnumerable<GrupoUnidadMedidaArticuloDTO>>> ObtenerTodoAsync() =>
            GetAsync<IEnumerable<GrupoUnidadMedidaArticuloDTO>>(Recurso);

        public Task<Respuesta<GrupoUnidadMedidaArticuloDTO>> ObtenerAsync(int id) =>
            GetAsync<GrupoUnidadMedidaArticuloDTO>($"{Recurso}/{id}");

        public Task<Respuesta<int>> InsertarAsync(GrupoUnidadMedidaArticuloCrearDTO dto) =>
            PostAsync<int>(Recurso, dto);

        public Task<Respuesta<bool>> ActualizarAsync(int id, GrupoUnidadMedidaArticuloActualizarDTO dto) =>
            PutAsync<bool>($"{Recurso}/{id}", dto);

        public Task<Respuesta<bool>> EliminarAsync(int id) =>
            DeleteAsync<bool>($"{Recurso}/{id}");
    }
}
