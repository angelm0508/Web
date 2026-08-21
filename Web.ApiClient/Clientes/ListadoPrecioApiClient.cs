using Web.ApiClient.Dtos;
using Web.ApiClient.Dtos.ListadoPrecio;

namespace Web.ApiClient.Clientes
{
    public class ListadoPrecioApiClient : ApiClientBase, IListadoPrecioApiClient
    {
        private const string Recurso = "api/ListadoPrecio";

        public ListadoPrecioApiClient(HttpClient http) : base(http) { }

        public Task<Respuesta<IEnumerable<ListadoPrecioDTO>>> ObtenerTodoAsync() =>
            GetAsync<IEnumerable<ListadoPrecioDTO>>(Recurso);

        public Task<Respuesta<ListadoPrecioDTO>> ObtenerAsync(int id) =>
            GetAsync<ListadoPrecioDTO>($"{Recurso}/{id}");

        public Task<Respuesta<int>> InsertarAsync(ListadoPrecioCrearDTO dto) =>
            PostAsync<int>(Recurso, dto);

        public Task<Respuesta<bool>> ActualizarAsync(int id, ListadoPrecioActualizarDTO dto) =>
            PutAsync<bool>($"{Recurso}/{id}", dto);

        public Task<Respuesta<bool>> EliminarAsync(int id) =>
            DeleteAsync<bool>($"{Recurso}/{id}");
    }
}
