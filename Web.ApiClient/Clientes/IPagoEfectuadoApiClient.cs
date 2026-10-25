using Web.ApiClient.Dtos;
using Web.ApiClient.Dtos.PagoEfectuado;

namespace Web.ApiClient.Clientes
{
    public interface IPagoEfectuadoApiClient
    {
        Task<Respuesta<IEnumerable<PagoEfectuadoDTO>>> ObtenerTodoAsync();
        Task<Respuesta<PagoEfectuadoDTO>> ObtenerAsync(int entry);
        Task<Respuesta<IEnumerable<PagoEfectuadoFacturaDTO>>> ObtenerFacturasAsync(int entry);
        Task<Respuesta<IEnumerable<PagoEfectuadoMedioDTO>>> ObtenerMediosAsync(int entry);
        Task<Respuesta<IEnumerable<DocumentoPorPagarDTO>>> ObtenerDocumentosPorPagarAsync(string codigoSn);
        Task<Respuesta<int>> InsertarAsync(PagoEfectuadoCrearDTO dto);
        Task<Respuesta<bool>> CancelarAsync(int entry);
    }
}
