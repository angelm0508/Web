using Web.ApiClient.Dtos;
using Web.ApiClient.Dtos.CreditoCliente;

namespace Web.ApiClient.Clientes
{
    public interface ICreditoClienteApiClient
    {
        /// <summary>Posición de crédito del cliente. Un cliente inexistente vuelve como Respuesta fallida con el mensaje de la API.</summary>
        Task<Respuesta<PosicionCreditoDTO>> ObtenerAsync(string codigoSn);

        /// <summary>Posiciones de varios clientes (la API admite hasta 500 por llamada; aquí se parte en bloques y se unen).</summary>
        Task<Respuesta<List<PosicionCreditoDTO>>> ObtenerPosicionesAsync(IEnumerable<string> codigosSn);
    }
}