using Web.ApiClient.Dtos;
using Web.ApiClient.Dtos.FabricanteArticulo;

namespace Web.ApiClient.Clientes
{
    public class FabricanteArticuloApiClient : ApiClientBase, IFabricanteArticuloApiClient
    {
        private const string Recurso = "api/FabricanteArticulo";

        public FabricanteArticuloApiClient(HttpClient http) : base(http) { }

        public Task<Respuesta<IEnumerable<FabricanteArticuloDTO>>> ObtenerTodoAsync() =>
            GetAsync<IEnumerable<FabricanteArticuloDTO>>(Recurso);

        public Task<Respuesta<FabricanteArticuloDTO>> ObtenerAsync(int id) =>
            GetAsync<FabricanteArticuloDTO>($"{Recurso}/{id}");

        public Task<Respuesta<int>> InsertarAsync(FabricanteArticuloCrearDTO dto) =>
            PostAsync<int>(Recurso, dto);

        public Task<Respuesta<bool>> ActualizarAsync(int id, FabricanteArticuloActualizarDTO dto) =>
            PutAsync<bool>($"{Recurso}/{id}", dto);

        public Task<Respuesta<bool>> EliminarAsync(int id) =>
            DeleteAsync<bool>($"{Recurso}/{id}");
    }
}
