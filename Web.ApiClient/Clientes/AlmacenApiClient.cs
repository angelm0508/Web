using Web.ApiClient.Dtos;
using Web.ApiClient.Dtos.Almacen;

namespace Web.ApiClient.Clientes
{
    public class AlmacenApiClient : ApiClientBase, IAlmacenApiClient
    {
        private const string Recurso = "api/Almacen";

        public AlmacenApiClient(HttpClient http) : base(http) { }

        public Task<Respuesta<IEnumerable<AlmacenDTO>>> ObtenerTodoAsync() =>
            GetAsync<IEnumerable<AlmacenDTO>>(Recurso);

        public Task<Respuesta<AlmacenDTO>> ObtenerAsync(string codigo) =>
            GetAsync<AlmacenDTO>($"{Recurso}/{codigo}");

        public Task<Respuesta<bool>> InsertarAsync(AlmacenCrearDTO dto) =>
            PostAsync<bool>(Recurso, dto);

        public Task<Respuesta<bool>> ActualizarAsync(string codigo, AlmacenActualizarDTO dto) =>
            PutAsync<bool>($"{Recurso}/{codigo}", dto);

        public Task<Respuesta<bool>> EliminarAsync(string codigo) =>
            DeleteAsync<bool>($"{Recurso}/{codigo}");

        public Task<Respuesta<IEnumerable<AlmacenDTO>>> ObtenerContenganNombreAsync(string nombre) =>
            GetAsync<IEnumerable<AlmacenDTO>>($"{Recurso}/ContengaNombre/{Uri.EscapeDataString(nombre)}");
    }
}
