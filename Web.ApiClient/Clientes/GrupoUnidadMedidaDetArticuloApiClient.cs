using Web.ApiClient.Dtos;
using Web.ApiClient.Dtos.GrupoUnidadMedidaDetArticulo;

namespace Web.ApiClient.Clientes
{
    public class GrupoUnidadMedidaDetArticuloApiClient : ApiClientBase, IGrupoUnidadMedidaDetArticuloApiClient
    {
        private const string Recurso = "api/GrupoUnidadMedidaDetArticulo";

        public GrupoUnidadMedidaDetArticuloApiClient(HttpClient http) : base(http) { }

        public Task<Respuesta<IEnumerable<GrupoUnidadMedidaDetArticuloDTO>>> ObtenerPorGrupoAsync(int grpMedidaEntry) =>
            GetAsync<IEnumerable<GrupoUnidadMedidaDetArticuloDTO>>($"{Recurso}/PorGrupo/{grpMedidaEntry}");

        public Task<Respuesta<GrupoUnidadMedidaDetArticuloDTO>> ObtenerAsync(int grpMedidaEntry, int numLinea) =>
            GetAsync<GrupoUnidadMedidaDetArticuloDTO>($"{Recurso}/{grpMedidaEntry}/{numLinea}");

        public Task<Respuesta<int>> InsertarAsync(GrupoUnidadMedidaDetArticuloCrearDTO dto) =>
            PostAsync<int>(Recurso, dto);

        public Task<Respuesta<bool>> ActualizarAsync(int grpMedidaEntry, int numLinea, GrupoUnidadMedidaDetArticuloActualizarDTO dto) =>
            PutAsync<bool>($"{Recurso}/{grpMedidaEntry}/{numLinea}", dto);

        public Task<Respuesta<bool>> EliminarAsync(int grpMedidaEntry, int numLinea) =>
            DeleteAsync<bool>($"{Recurso}/{grpMedidaEntry}/{numLinea}");
    }
}
