using Web.ApiClient.Dtos;
using Web.ApiClient.Dtos.OrdenServicio;

namespace Web.ApiClient.Clientes
{
    public interface IOrdenServicioDetalleApiClient
    {
        Task<Respuesta<int>> InsertarAsync(OrdenServicioDetalleCrearDTO dto);
        Task<Respuesta<bool>> ActualizarAsync(int entry, int noLinea, OrdenServicioDetalleActualizarDTO dto);
        Task<Respuesta<bool>> EliminarAsync(int entry, int noLinea);
    }
}
