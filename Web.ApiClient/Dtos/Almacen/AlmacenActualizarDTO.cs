using System.ComponentModel.DataAnnotations;

namespace Web.ApiClient.Dtos.Almacen
{
    public class AlmacenActualizarDTO
    {
        [Display(Name = "Nombre")]
        [Required(ErrorMessage = "El campo {0} es requerido.")]
        public string? Nombre { get; set; }

        [Display(Name = "Activo")]
        [Required(ErrorMessage = "El campo {0} es requerido.")]
        public string? Activo { get; set; }

        [Display(Name = "Calle")]
        public string? Calle { get; set; }

        [Display(Name = "Código postal")]
        public string? CodigoPostal { get; set; }

        [Display(Name = "País")]
        public string? Pais { get; set; }

        [Display(Name = "Municipio")]
        public string? Municipio { get; set; }

        [Display(Name = "Departamento")]
        public string? Departamento { get; set; }

        [Display(Name = "Bloqueado")]
        public string? Bloqueado { get; set; }
    }
}
