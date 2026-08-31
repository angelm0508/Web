using Web.ApiClient.Dtos;
using Web.ApiClient.Dtos.MovimientoInventario;

namespace Web.ApiClient.Clientes
{
    public interface IMovimientoInventarioApiClient
    {
        Task<Respuesta<IEnumerable<MovimientoInventarioDTO>>> ObtenerPorArticuloAsync(
            string codArticulo, string? almacen = null, DateTime? desde = null, DateTime? hasta = null);
    }
}
