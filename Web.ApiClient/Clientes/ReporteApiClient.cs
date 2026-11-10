using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Web.ApiClient.Dtos;
using Web.ApiClient.Dtos.Reporte;

namespace Web.ApiClient.Clientes
{
    public class ReporteApiClient : ApiClientBase, IReporteApiClient
    {
        private const string Recurso = "api/Reporte";
        private static readonly JsonSerializerOptions OpcionesJson = new(JsonSerializerDefaults.Web);

        public ReporteApiClient(HttpClient http) : base(http) { }

        public Task<Respuesta<List<ReporteResumenDTO>>> ObtenerCatalogoAsync() =>
            GetAsync<List<ReporteResumenDTO>>(Recurso);

        public Task<Respuesta<JsonElement>> ObtenerDefinicionAsync(string codigo) =>
            GetAsync<JsonElement>($"{Recurso}/{Uri.EscapeDataString(codigo)}");

        public Task<Respuesta<JsonElement>> EjecutarAsync(string codigo, JsonElement solicitud) =>
            PostAsync<JsonElement>($"{Recurso}/{Uri.EscapeDataString(codigo)}/ejecutar", solicitud);

        public Task<Respuesta<JsonElement>> ObtenerVistasAsync(string codigo) =>
            GetAsync<JsonElement>($"{Recurso}/{Uri.EscapeDataString(codigo)}/vistas");

        public Task<Respuesta<JsonElement>> GuardarVistaAsync(string codigo, JsonElement vista) =>
            PostAsync<JsonElement>($"{Recurso}/{Uri.EscapeDataString(codigo)}/vistas", vista);

        public Task<Respuesta<bool>> EliminarVistaAsync(string codigo, int entry) =>
            DeleteAsync<bool>($"{Recurso}/{Uri.EscapeDataString(codigo)}/vistas/{entry}");

        public async Task<ArchivoDescargado> ExportarAsync(string codigo, string formato, JsonElement cuerpo)
        {
            try
            {
                using var response = await Http.PostAsJsonAsync(
                    $"{Recurso}/{Uri.EscapeDataString(codigo)}/exportar?formato={Uri.EscapeDataString(formato)}", cuerpo, OpcionesJson);

                if (response.IsSuccessStatusCode)
                {
                    var disposicion = response.Content.Headers.ContentDisposition;
                    return new ArchivoDescargado
                    {
                        Contenido = await response.Content.ReadAsByteArrayAsync(),
                        ContentType = response.Content.Headers.ContentType?.MediaType ?? "application/octet-stream",
                        NombreArchivo = disposicion?.FileNameStar ?? disposicion?.FileName?.Trim('"') ?? $"reporte.{formato}"
                    };
                }

                if (response.StatusCode is HttpStatusCode.Unauthorized or HttpStatusCode.Forbidden)
                    return new ArchivoDescargado { Error = "Tu sesión expiró o no tienes permisos. Por favor inicia sesión nuevamente." };

                return new ArchivoDescargado { Error = ExtraerMensaje(await response.Content.ReadAsStringAsync()) };
            }
            catch (Exception ex)
            {
                return new ArchivoDescargado { Error = $"No se pudo conectar con la API: {ex.Message}" };
            }
        }

        private static string ExtraerMensaje(string contenido)
        {
            try
            {
                using var documento = JsonDocument.Parse(contenido);
                if (documento.RootElement.TryGetProperty("mensaje", out var m) && m.ValueKind == JsonValueKind.String)
                    return m.GetString() ?? "No se pudo generar el archivo.";
            }
            catch (JsonException) { }
            return "No se pudo generar el archivo.";
        }
    }
}
