using System.ComponentModel.DataAnnotations;

namespace Web.ApiClient.Dtos.GrupoSn
{
    public class GrupoSnCrearDTO
    {
        [Required(ErrorMessage = "El nombre es requerido.")]
        [Display(Name = "Nombre")]
        public string? Nombre { get; set; }

        [Display(Name = "Bloqueado")]
        public string? Bloqueado { get; set; } = "N";
    }
}
