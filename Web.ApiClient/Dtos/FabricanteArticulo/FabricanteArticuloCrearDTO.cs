using System.ComponentModel.DataAnnotations;

namespace Web.ApiClient.Dtos.FabricanteArticulo
{
    public class FabricanteArticuloCrearDTO
    {
        [Required(ErrorMessage = "El nombre es requerido.")]
        [Display(Name = "Nombre")]
        public string Nombre { get; set; } = string.Empty;

        [Display(Name = "Bloqueado")]
        public string? Bloqueado { get; set; } = "N";
    }
}
