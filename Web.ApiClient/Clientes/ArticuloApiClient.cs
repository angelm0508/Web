using Web.ApiClient.Dtos;
using Web.ApiClient.Dtos.Articulo;

namespace Web.ApiClient.Clientes
{
    public class ArticuloApiClient : ApiClientBase, IArticuloApiClient
    {
        private const string Recurso = "api/Articulo";

        public ArticuloApiClient(HttpClient http) : base(http) { }

        public Task<Respuesta<IEnumerable<ArticuloDTO>>> ObtenerTodoAsync() =>
            GetAsync<IEnumerable<ArticuloDTO>>(Recurso);

        public Task<Respuesta<ArticuloDTO>> ObtenerAsync(string codigo) =>
            GetAsync<ArticuloDTO>($"{Recurso}/{codigo}");

        public Task<Respuesta<string>> InsertarAsync(ArticuloCrearDTO dto) =>
            PostAsync<string>(Recurso, dto);

        public Task<Respuesta<bool>> ActualizarAsync(string codigo, ArticuloActualizarDTO dto) =>
            PutAsync<bool>($"{Recurso}/{codigo}", dto);

        public Task<Respuesta<bool>> EliminarAsync(string codigo) =>
            DeleteAsync<bool>($"{Recurso}/{codigo}");
    }
}
