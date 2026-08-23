using Web.ApiClient.Dtos;
using Web.ApiClient.Dtos.GrupoUnidadMedidaDetArticulo;

namespace Web.ApiClient.Clientes
{
    public interface IGrupoUnidadMedidaDetArticuloApiClient
    {
        Task<Respuesta<IEnumerable<GrupoUnidadMedidaDetArticuloDTO>>> ObtenerPorGrupoAsync(int grpMedidaEntry);
        Task<Respuesta<GrupoUnidadMedidaDetArticuloDTO>> ObtenerAsync(int grpMedidaEntry, int numLinea);
        Task<Respuesta<int>> InsertarAsync(GrupoUnidadMedidaDetArticuloCrearDTO dto);
        Task<Respuesta<bool>> ActualizarAsync(int grpMedidaEntry, int numLinea, GrupoUnidadMedidaDetArticuloActualizarDTO dto);
        Task<Respuesta<bool>> EliminarAsync(int grpMedidaEntry, int numLinea);
    }
}
