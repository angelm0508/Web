using System.ComponentModel.DataAnnotations;

namespace Web.ApiClient.Dtos.GrupoUnidadMedidaArticulo
{
    public class GrupoUnidadMedidaArticuloActualizarDTO
    {
        [Display(Name = "Nombre")]
        public string? Nombre { get; set; }

        [Display(Name = "Unidad base")]
        public int BaseMedida { get; set; }

        [Display(Name = "Bloqueado")]
        public string? Bloqueado { get; set; }
    }
}
