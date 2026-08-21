using System.ComponentModel.DataAnnotations;

namespace Web.ApiClient.Dtos.GrupoArticulo
{
    public class GrupoArticuloActualizarDTO
    {
        [Required(ErrorMessage = "El nombre es requerido.")]
        [Display(Name = "Nombre")]
        public string Nombre { get; set; } = string.Empty;

        [Display(Name = "Bloqueado")]
        public string? Bloqueado { get; set; }
    }
}
