using System.Text.Json;
using Web.ApiClient.Dtos;
using Web.ApiClient.Dtos.Reporte;

namespace Web.ApiClient.Clientes
{
    /// <summary>Archivo generado por la API (o el motivo por el que no se pudo generar).</summary>
    public sealed class ArchivoDescargado
    {
        public byte[]? Contenido { get; set; }
        public string ContentType { get; set; } = "application/octet-stream";
        public string NombreArchivo { get; set; } = "reporte";
        public string? Error { get; set; }
    }

    public interface IReporteApiClient
    {
        Task<Respuesta<List<ReporteResumenDTO>>> ObtenerCatalogoAsync();

        /// <summary>La definición y los resultados son dinámicos: pasan tal cual (JSON) desde la API hasta el navegador.</summary>
        Task<Respuesta<JsonElement>> ObtenerDefinicionAsync(string codigo);
        Task<Respuesta<JsonElement>> EjecutarAsync(string codigo, JsonElement solicitud);
        Task<ArchivoDescargado> ExportarAsync(string codigo, string formato, JsonElement cuerpo);

        /// <summary>Vistas guardadas del usuario para el reporte (lista de { entry, nombre, configuracion }); pasan tal cual al navegador.</summary>
        Task<Respuesta<JsonElement>> ObtenerVistasAsync(string codigo);
        Task<Respuesta<JsonElement>> GuardarVistaAsync(string codigo, JsonElement vista);
        Task<Respuesta<bool>> EliminarVistaAsync(string codigo, int entry);
    }
}
