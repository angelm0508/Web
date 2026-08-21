using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Web.ApiClient.Dtos;

namespace Web.ApiClient
{
    /// <summary>
    /// Maneja de forma centralizada el envío HTTP y la deserialización de las respuestas de la API,
    /// que siempre viajan como Respuesta&lt;T&gt; (éxito, 400 y 404 incluidos). Evita repetir este
    /// manejo en cada uno de los clientes tipados de recurso.
    /// </summary>
    public abstract class ApiClientBase
    {
        private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

        protected readonly HttpClient Http;

        protected ApiClientBase(HttpClient http)
        {
            Http = http;
        }

        protected Task<Respuesta<T>> GetAsync<T>(string url) =>
            EnviarAsync<T>(() => Http.GetAsync(url));

        protected Task<Respuesta<T>> PostAsync<T>(string url, object body) =>
            EnviarAsync<T>(() => Http.PostAsJsonAsync(url, body, JsonOptions));

        protected Task<Respuesta<T>> PutAsync<T>(string url, object body) =>
            EnviarAsync<T>(() => Http.PutAsJsonAsync(url, body, JsonOptions));

        protected Task<Respuesta<T>> DeleteAsync<T>(string url) =>
            EnviarAsync<T>(() => Http.DeleteAsync(url));

        private static async Task<Respuesta<T>> EnviarAsync<T>(Func<Task<HttpResponseMessage>> enviar)
        {
            try
            {
                using var response = await enviar();

                if (response.StatusCode == HttpStatusCode.Unauthorized || response.StatusCode == HttpStatusCode.Forbidden)
                {
                    return new Respuesta<T>
                    {
                        Resultado = false,
                        Mensaje = "Tu sesión expiró o no tienes permisos. Por favor inicia sesión nuevamente."
                    };
                }

                var contenido = await response.Content.ReadAsStringAsync();
                if (string.IsNullOrWhiteSpace(contenido))
                {
                    return new Respuesta<T>
                    {
                        Resultado = false,
                        Mensaje = "La API devolvió una respuesta vacía o inesperada."
                    };
                }

                // Se parsea a mano (en vez de deserializar Respuesta<T> completo de una vez) porque, para T
                // de tipo valor (bool, int), "T? Dato" en un genérico sin restricción NO se convierte en
                // Nullable<T> en tiempo de ejecución -- sigue siendo T puro, y un "dato": null en la respuesta
                // (los 400/404 de la API siempre lo traen así) rompería la deserialización directa.
                using var documento = JsonDocument.Parse(contenido);
                var raiz = documento.RootElement;

                var resultado = raiz.TryGetProperty("resultado", out var resultadoEl) && resultadoEl.ValueKind == JsonValueKind.True;
                var mensaje = raiz.TryGetProperty("mensaje", out var mensajeEl) ? mensajeEl.GetString() ?? string.Empty : string.Empty;

                T? dato = default;
                if (raiz.TryGetProperty("dato", out var datoEl) && datoEl.ValueKind != JsonValueKind.Null)
                {
                    dato = datoEl.Deserialize<T>(JsonOptions);
                }

                return new Respuesta<T> { Dato = dato, Resultado = resultado, Mensaje = mensaje };
            }
            catch (Exception ex)
            {
                return new Respuesta<T>
                {
                    Resultado = false,
                    Mensaje = $"No se pudo conectar con la API: {ex.Message}"
                };
            }
        }
    }
}
