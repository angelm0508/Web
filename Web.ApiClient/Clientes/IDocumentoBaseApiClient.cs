using Web.ApiClient.Dtos;
using Web.ApiClient.Dtos.DocumentoBase;

namespace Web.ApiClient.Clientes
{
    public interface IDocumentoBaseApiClient
    {
        /// <summary>Borrador del documento destino con las líneas abiertas del origen ("Copiar a").</summary>
        Task<Respuesta<DocumentoBaseBorradorDTO>> ObtenerBorradorAsync(int tipoOrigen, int entry, int tipoDestino);
    }
}
