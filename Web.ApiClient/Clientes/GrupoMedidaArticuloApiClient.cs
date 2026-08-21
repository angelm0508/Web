using Web.ApiClient.Dtos;
using Web.ApiClient.Dtos.GrupoMedidaArticulo;

namespace Web.ApiClient.Clientes
{
    /// <summary>
    /// Solo lectura: se usa como fuente del dropdown "Medida" del módulo Artículos
    /// (FK real: Articulo.CodigoGrpMedida -> GrupoMedidaArticulo.Entry).
    /// </summary>
    public class GrupoMedidaArticuloApiClient : ApiClientBase, IGrupoMedidaArticuloApiClient
    {
        private const string Recurso = "api/GrupoMedidaArticulo";

        public GrupoMedidaArticuloApiClient(HttpClient http) : base(http) { }

        public Task<Respuesta<IEnumerable<GrupoMedidaArticuloDTO>>> ObtenerTodoAsync() =>
            GetAsync<IEnumerable<GrupoMedidaArticuloDTO>>(Recurso);

        public Task<Respuesta<GrupoMedidaArticuloDTO>> ObtenerAsync(int id) =>
            GetAsync<GrupoMedidaArticuloDTO>($"{Recurso}/{id}");
    }
}
