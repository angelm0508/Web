using Web.ApiClient.Dtos;
using Web.ApiClient.Dtos.CreditoCliente;

namespace Web.ApiClient.Clientes
{
    public class CreditoClienteApiClient : ApiClientBase, ICreditoClienteApiClient
    {
        private const string Recurso = "api/CreditoCliente";
        private const int MaxPorLlamada = 500;

        public CreditoClienteApiClient(HttpClient http) : base(http) { }

        public Task<Respuesta<PosicionCreditoDTO>> ObtenerAsync(string codigoSn) =>
            GetAsync<PosicionCreditoDTO>($"{Recurso}/{Uri.EscapeDataString(codigoSn)}");

        public async Task<Respuesta<List<PosicionCreditoDTO>>> ObtenerPosicionesAsync(IEnumerable<string> codigosSn)
        {
            var codigos = codigosSn
                .Where(c => !string.IsNullOrWhiteSpace(c))
                .Select(c => c.Trim())
                .Distinct()
                .ToList();

            var posiciones = new List<PosicionCreditoDTO>();
            if (codigos.Count == 0)
                return new Respuesta<List<PosicionCreditoDTO>> { Resultado = true, Dato = posiciones };

            foreach (var bloque in codigos.Chunk(MaxPorLlamada))
            {
                var respuesta = await PostAsync<List<PosicionCreditoDTO>>($"{Recurso}/Posiciones", bloque);
                if (!respuesta.Resultado)
                    return respuesta;

                if (respuesta.Dato != null)
                    posiciones.AddRange(respuesta.Dato);
            }

            return new Respuesta<List<PosicionCreditoDTO>> { Resultado = true, Dato = posiciones };
        }
    }
}