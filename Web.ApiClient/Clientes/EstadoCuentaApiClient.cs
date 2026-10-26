using System.Globalization;
using Web.ApiClient.Dtos;
using Web.ApiClient.Dtos.EstadoCuenta;

namespace Web.ApiClient.Clientes
{
    public class EstadoCuentaApiClient : ApiClientBase, IEstadoCuentaApiClient
    {
        private const string Recurso = "api/EstadoCuenta";

        public EstadoCuentaApiClient(HttpClient http) : base(http) { }

        public Task<Respuesta<EstadoCuentaDTO>> ObtenerAsync(string codigoSn, DateTime? desde = null, DateTime? hasta = null)
        {
            var parametros = new List<string>();
            if (desde.HasValue)
                parametros.Add("desde=" + Uri.EscapeDataString(desde.Value.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture)));
            if (hasta.HasValue)
                parametros.Add("hasta=" + Uri.EscapeDataString(hasta.Value.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture)));

            var url = $"{Recurso}/{Uri.EscapeDataString(codigoSn)}";
            if (parametros.Count > 0)
                url += "?" + string.Join("&", parametros);

            return GetAsync<EstadoCuentaDTO>(url);
        }

        public Task<Respuesta<IEnumerable<SaldoSocioDTO>>> ObtenerSaldosAsync(IEnumerable<string> codigosSn) =>
            PostAsync<IEnumerable<SaldoSocioDTO>>($"{Recurso}/Saldos", codigosSn.ToList());
    }
}
