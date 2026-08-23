using System.ComponentModel.DataAnnotations;

namespace Web.ApiClient.Dtos.GrupoUnidadMedidaArticulo
{
    public class GrupoUnidadMedidaArticuloCrearDTO
    {
        [Required(ErrorMessage = "El nombre es requerido.")]
        [Display(Name = "Nombre")]
        public string? Nombre { get; set; }

        [Required(ErrorMessage = "La unidad base es requerida.")]
        [Display(Name = "Unidad base")]
        public int BaseMedida { get; set; }

        [Display(Name = "Bloqueado")]
        public string? Bloqueado { get; set; } = "N";
    }
}
