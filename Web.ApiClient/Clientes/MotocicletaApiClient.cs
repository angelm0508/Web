using Web.ApiClient.Dtos;
using Web.ApiClient.Dtos.Motocicleta;
using Web.ApiClient.Dtos.OrdenServicio;

namespace Web.ApiClient.Clientes
{
    public class MotocicletaApiClient : ApiClientBase, IMotocicletaApiClient
    {
        private const string Recurso = "api/Motocicleta";

        public MotocicletaApiClient(HttpClient http) : base(http) { }

        public Task<Respuesta<IEnumerable<MotocicletaDTO>>> BuscarAsync(string? codigoSn, string? placa)
        {
            var consulta = new List<string>();
            if (!string.IsNullOrWhiteSpace(codigoSn)) consulta.Add($"codigoSn={Uri.EscapeDataString(codigoSn)}");
            if (!string.IsNullOrWhiteSpace(placa)) consulta.Add($"placa={Uri.EscapeDataString(placa)}");
            var url = consulta.Count == 0 ? Recurso : $"{Recurso}?{string.Join("&", consulta)}";
            return GetAsync<IEnumerable<MotocicletaDTO>>(url);
        }

        public Task<Respuesta<MotocicletaDTO>> ObtenerAsync(int entry) =>
            GetAsync<MotocicletaDTO>($"{Recurso}/{entry}");

        public Task<Respuesta<int>> InsertarAsync(MotocicletaCrearDTO dto) =>
            PostAsync<int>(Recurso, dto);

        public Task<Respuesta<bool>> ActualizarAsync(int entry, MotocicletaActualizarDTO dto) =>
            PutAsync<bool>($"{Recurso}/{entry}", dto);

        public Task<Respuesta<bool>> EliminarAsync(int entry) =>
            DeleteAsync<bool>($"{Recurso}/{entry}");

        public Task<Respuesta<IEnumerable<OrdenServicioDTO>>> ObtenerHistorialAsync(int entry) =>
            GetAsync<IEnumerable<OrdenServicioDTO>>($"{Recurso}/{entry}/Historial");
    }
}
