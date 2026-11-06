using Web.ApiClient.Clientes;
using Web.ApiClient.Dtos.CondicionPago;

namespace Web.UI.Controllers
{
    /// <summary>
    /// Condiciones de pago para el selector de los formularios de factura y nota de débito
    /// (de cliente y de proveedor); las cuatro pantallas comparten esta consulta.
    /// </summary>
    internal static class CondicionesPagoDocumento
    {
        /// <summary>
        /// Condiciones activas ordenadas por días (la API no permite asignar una inactiva a un documento nuevo).
        /// Si <paramref name="condicionActual"/> ya no está activa se agrega marcada como "(inactiva)", con sus
        /// días, para no perderla en silencio al mostrar un documento o un socio que todavía la usa.
        /// </summary>
        public static async Task<List<CondicionPagoDTO>> ObtenerParaFormularioAsync(ICondicionPagoApiClient condiciones, string? condicionActual)
        {
            var respuesta = await condiciones.ObtenerTodoAsync();
            var todas = (respuesta.Dato ?? []).ToList();
            var lista = todas
                .Where(c => c.Activo == "S")
                .OrderBy(c => c.Dias).ThenBy(c => c.Nombre)
                .ToList();

            if (!string.IsNullOrWhiteSpace(condicionActual) && !lista.Any(c => c.Codigo == condicionActual))
            {
                var inactiva = todas.FirstOrDefault(c => c.Codigo == condicionActual);
                lista.Add(new CondicionPagoDTO
                {
                    Codigo = condicionActual,
                    Nombre = $"{inactiva?.Nombre ?? condicionActual} (inactiva)",
                    Dias = inactiva?.Dias ?? 0,
                    Activo = "N"
                });
            }
            return lista;
        }
    }
}
