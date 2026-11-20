using Web.ApiClient.Dtos;
using Web.ApiClient.Dtos.Pos;

namespace Web.ApiClient.Clientes
{
    public interface IPosApiClient
    {
        Task<Respuesta<PosConfiguracionVista>> ObtenerConfiguracionAsync();
        Task<Respuesta<PosConfiguracionVista>> GuardarConfiguracionAsync(PosConfiguracionDato dato);
        Task<Respuesta<PosContexto>> ObtenerContextoAsync();
        Task<Respuesta<List<ClientePos>>> BuscarClientesAsync(string texto);
        Task<Respuesta<List<ArticuloPos>>> BuscarArticulosAsync(string texto, string? cliente);
        Task<Respuesta<ArticuloPos>> ObtenerArticuloPorCodigoAsync(string codigo, string? cliente);
        Task<Respuesta<List<ArticuloPos>>> ObtenerRapidosAsync();
        Task<Respuesta<TicketPos>> VenderAsync(VentaPosSolicitud solicitud);
        Task<Respuesta<TicketPos>> ObtenerTicketAsync(int facturaEntry);
        Task<Respuesta<List<VentaPosDelDia>>> ObtenerVentasDelDiaAsync();
    }
}
