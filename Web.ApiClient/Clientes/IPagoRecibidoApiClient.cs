using Web.ApiClient.Dtos;
using Web.ApiClient.Dtos.PagoRecibido;

namespace Web.ApiClient.Clientes
{
    public interface IPagoRecibidoApiClient
    {
        Task<Respuesta<IEnumerable<PagoRecibidoDTO>>> ObtenerTodoAsync();
        Task<Respuesta<PagoRecibidoDTO>> ObtenerAsync(int entry);
        Task<Respuesta<IEnumerable<PagoRecibidoFacturaDTO>>> ObtenerFacturasAsync(int entry);
        Task<Respuesta<IEnumerable<PagoRecibidoMedioDTO>>> ObtenerMediosAsync(int entry);
        Task<Respuesta<IEnumerable<DocumentoPorCobrarDTO>>> ObtenerDocumentosPorCobrarAsync(string codigoSn);
        Task<Respuesta<int>> InsertarAsync(PagoRecibidoCrearDTO dto);
        Task<Respuesta<bool>> CancelarAsync(int entry);
    }
}
