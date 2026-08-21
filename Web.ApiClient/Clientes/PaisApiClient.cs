using Web.ApiClient.Dtos;
using Web.ApiClient.Dtos.Pais;

namespace Web.ApiClient.Clientes
{
    /// <summary>Solo lectura: fuente del dropdown "País" en formularios que lo requieren (ej. Almacenes).</summary>
    public class PaisApiClient : ApiClientBase, IPaisApiClient
    {
        public PaisApiClient(HttpClient http) : base(http) { }

        public Task<Respuesta<IEnumerable<PaisDTO>>> ObtenerTodoAsync() =>
            GetAsync<IEnumerable<PaisDTO>>("api/Pais");
    }
}
