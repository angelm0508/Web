using System.ComponentModel.DataAnnotations;

namespace Web.ApiClient.Dtos.GrupoUnidadMedidaArticulo
{
    public class GrupoUnidadMedidaArticuloActualizarDTO
    {
        [Display(Name = "Nombre Grupo")]
        public string? Codigo { get; set; }

        [Display(Name = "Descripción")]
        public string? Nombre { get; set; }

        [Display(Name = "Unidad de medida base")]
        public int BaseMedida { get; set; }

        public string? Bloqueado { get; set; }
    }
}
