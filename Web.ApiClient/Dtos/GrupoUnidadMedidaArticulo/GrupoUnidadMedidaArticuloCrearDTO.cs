using System.ComponentModel.DataAnnotations;

namespace Web.ApiClient.Dtos.GrupoUnidadMedidaArticulo
{
    public class GrupoUnidadMedidaArticuloCrearDTO
    {
        [Required(ErrorMessage = "El nombre del grupo es requerido.")]
        [Display(Name = "Nombre Grupo")]
        public string? Codigo { get; set; }

        [Display(Name = "Descripción")]
        public string? Nombre { get; set; }

        [Required(ErrorMessage = "La unidad de medida base es requerida.")]
        [Display(Name = "Unidad de medida base")]
        public int BaseMedida { get; set; }

        public string? Bloqueado { get; set; } = "N";
    }
}
