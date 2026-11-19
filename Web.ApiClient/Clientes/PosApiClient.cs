using Web.ApiClient.Dtos;
using Web.ApiClient.Dtos.Pos;

namespace Web.ApiClient.Clientes
{
    public class PosApiClient : ApiClientBase, IPosApiClient
    {
        private const string Recurso = "api/Pos";

        public PosApiClient(HttpClient http) : base(http) { }

        public Task<Respuesta<PosConfiguracionVista>> ObtenerConfiguracionAsync() =>
            GetAsync<PosConfiguracionVista>($"{Recurso}/Configuracion");

        public Task<Respuesta<PosConfiguracionVista>> GuardarConfiguracionAsync(PosConfiguracionDato dato) =>
            PutAsync<PosConfiguracionVista>($"{Recurso}/Configuracion", dato);

        public Task<Respuesta<List<ArticuloPos>>> BuscarArticulosAsync(string texto, string? cliente) =>
            GetAsync<List<ArticuloPos>>($"{Recurso}/Articulos?texto={Uri.EscapeDataString(texto ?? string.Empty)}{ParametroCliente(cliente, '&')}");

        // El código va en un segmento de ruta: se codifica para que "/", "?", "#" o espacios del código de barras no cambien la ruta.
        public Task<Respuesta<ArticuloPos>> ObtenerArticuloPorCodigoAsync(string codigo, string? cliente) =>
            GetAsync<ArticuloPos>($"{Recurso}/Articulos/porCodigo/{Uri.EscapeDataString(codigo ?? string.Empty)}{ParametroCliente(cliente, '?')}");

        public Task<Respuesta<List<ArticuloPos>>> ObtenerRapidosAsync() =>
            GetAsync<List<ArticuloPos>>($"{Recurso}/Rapidos");

        public Task<Respuesta<TicketPos>> VenderAsync(VentaPosSolicitud solicitud) =>
            PostAsync<TicketPos>($"{Recurso}/Venta", solicitud);

        public Task<Respuesta<TicketPos>> ObtenerTicketAsync(int facturaEntry) =>
            GetAsync<TicketPos>($"{Recurso}/Ticket/{facturaEntry}");

        public Task<Respuesta<List<VentaPosDelDia>>> ObtenerVentasDelDiaAsync() =>
            GetAsync<List<VentaPosDelDia>>($"{Recurso}/VentasDelDia");

        private static string ParametroCliente(string? cliente, char separador) =>
            string.IsNullOrWhiteSpace(cliente) ? string.Empty : $"{separador}cliente={Uri.EscapeDataString(cliente)}";
    }
}
