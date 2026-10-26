using Web.ApiClient.Dtos;
using Web.ApiClient.Dtos.EstadoCuenta;

namespace Web.ApiClient.Clientes
{
    public interface IEstadoCuentaApiClient
    {
        /// <summary>Estado de cuenta del socio. Si desde o hasta son null la API usa su rango por defecto (1 de enero del año en curso a hoy). Un socio inexistente vuelve como Respuesta fallida con el mensaje de la API.</summary>
        Task<Respuesta<EstadoCuentaDTO>> ObtenerAsync(string codigoSn, DateTime? desde = null, DateTime? hasta = null);
        Task<Respuesta<IEnumerable<SaldoSocioDTO>>> ObtenerSaldosAsync(IEnumerable<string> codigosSn);
    }
}
