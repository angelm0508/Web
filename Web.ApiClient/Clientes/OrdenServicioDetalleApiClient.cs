using Web.ApiClient.Dtos;
using Web.ApiClient.Dtos.OrdenServicio;

namespace Web.ApiClient.Clientes
{
    public class OrdenServicioDetalleApiClient : ApiClientBase, IOrdenServicioDetalleApiClient
    {
        private const string Recurso = "api/OrdenServicioDetalle";

        public OrdenServicioDetalleApiClient(HttpClient http) : base(http) { }

        public Task<Respuesta<int>> InsertarAsync(OrdenServicioDetalleCrearDTO dto) =>
            PostAsync<int>(Recurso, dto);

        public Task<Respuesta<bool>> ActualizarAsync(int entry, int noLinea, OrdenServicioDetalleActualizarDTO dto) =>
            PutAsync<bool>($"{Recurso}/{entry}/{noLinea}", dto);

        public Task<Respuesta<bool>> EliminarAsync(int entry, int noLinea) =>
            DeleteAsync<bool>($"{Recurso}/{entry}/{noLinea}");
    }
}
