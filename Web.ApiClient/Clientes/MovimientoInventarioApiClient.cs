using Web.ApiClient.Dtos;
using Web.ApiClient.Dtos.MovimientoInventario;

namespace Web.ApiClient.Clientes
{
    public class MovimientoInventarioApiClient : ApiClientBase, IMovimientoInventarioApiClient
    {
        private const string Recurso = "api/MovimientoInventario";

        public MovimientoInventarioApiClient(HttpClient http) : base(http) { }

        public Task<Respuesta<IEnumerable<MovimientoInventarioDTO>>> ObtenerPorArticuloAsync(
            string codArticulo, string? almacen = null, DateTime? desde = null, DateTime? hasta = null)
        {
            var qs = new List<string>();
            if (!string.IsNullOrWhiteSpace(almacen)) qs.Add($"almacen={Uri.EscapeDataString(almacen)}");
            if (desde.HasValue) qs.Add($"desde={desde.Value:yyyy-MM-dd}");
            if (hasta.HasValue) qs.Add($"hasta={hasta.Value:yyyy-MM-dd}");
            var url = $"{Recurso}/PorArticulo/{Uri.EscapeDataString(codArticulo)}";
            if (qs.Count > 0) url += $"?{string.Join("&", qs)}";
            return GetAsync<IEnumerable<MovimientoInventarioDTO>>(url);
        }
    }
}
