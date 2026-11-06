using Web.ApiClient.Dtos.CreditoCliente;

namespace Web.ApiClient.Dtos
{
    /// <summary>
    /// Respuesta de un alta sujeta al control de crédito: si la API la rechaza con 409, el detalle del
    /// rechazo (límite, saldo, comprometido, vencido, monto, exceso) viaja en <see cref="Credito"/>.
    /// En cualquier otro caso <see cref="Credito"/> es null.
    /// </summary>
    public class RespuestaCredito<T> : Respuesta<T>
    {
        public CreditoExcedidoDTO? Credito { get; set; }
    }
}