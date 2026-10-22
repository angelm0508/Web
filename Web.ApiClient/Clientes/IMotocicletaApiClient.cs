using Web.ApiClient.Dtos;
using Web.ApiClient.Dtos.Motocicleta;
using Web.ApiClient.Dtos.OrdenServicio;

namespace Web.ApiClient.Clientes
{
    public interface IMotocicletaApiClient
    {
        Task<Respuesta<IEnumerable<MotocicletaDTO>>> BuscarAsync(string? codigoSn, string? placa);
        Task<Respuesta<MotocicletaDTO>> ObtenerAsync(int entry);
        Task<Respuesta<int>> InsertarAsync(MotocicletaCrearDTO dto);
        Task<Respuesta<bool>> ActualizarAsync(int entry, MotocicletaActualizarDTO dto);
        Task<Respuesta<bool>> EliminarAsync(int entry);
        Task<Respuesta<IEnumerable<OrdenServicioDTO>>> ObtenerHistorialAsync(int entry);
    }
}
