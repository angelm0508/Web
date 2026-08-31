using Web.ApiClient.Dtos;
using Web.ApiClient.Dtos.Existencia;

namespace Web.ApiClient.Clientes
{
    public class ExistenciaApiClient : ApiClientBase, IExistenciaApiClient
    {
        private const string Recurso = "api/Existencia";

        public ExistenciaApiClient(HttpClient http) : base(http) { }

        public Task<Respuesta<IEnumerable<ExistenciaArticuloDTO>>> ObtenerTodoAsync(string? articulo = null, string? almacen = null)
        {
            var qs = new List<string>();
            if (!string.IsNullOrWhiteSpace(articulo)) qs.Add($"articulo={Uri.EscapeDataString(articulo)}");
            if (!string.IsNullOrWhiteSpace(almacen)) qs.Add($"almacen={Uri.EscapeDataString(almacen)}");
            var url = qs.Count == 0 ? Recurso : $"{Recurso}?{string.Join("&", qs)}";
            return GetAsync<IEnumerable<ExistenciaArticuloDTO>>(url);
        }

        public Task<Respuesta<IEnumerable<ExistenciaArticuloDTO>>> ObtenerPorArticuloAsync(string codArticulo) =>
            GetAsync<IEnumerable<ExistenciaArticuloDTO>>($"{Recurso}/PorArticulo/{Uri.EscapeDataString(codArticulo)}");
    }
}
