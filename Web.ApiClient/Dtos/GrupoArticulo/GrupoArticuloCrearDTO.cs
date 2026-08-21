using System.ComponentModel.DataAnnotations;

namespace Web.ApiClient.Dtos.GrupoArticulo
{
    public class GrupoArticuloCrearDTO
    {
        [Required(ErrorMessage = "El nombre es requerido.")]
        [Display(Name = "Nombre")]
        public string Nombre { get; set; } = string.Empty;
    }
}
