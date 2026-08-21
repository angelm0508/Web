using System.ComponentModel.DataAnnotations;

namespace Web.ApiClient.Dtos.Almacen
{
    public class AlmacenCrearDTO
    {
        [Required(ErrorMessage = "El código es requerido.")]
        [Display(Name = "Código")]
        public string Codigo { get; set; } = null!;

        [Display(Name = "Nombre")]
        public string? Nombre { get; set; }

        [Required(ErrorMessage = "El campo Activo es requerido.")]
        [Display(Name = "Activo")]
        public string Activo { get; set; } = "S";

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
        public string? Bloqueado { get; set; } = "N";
    }
}
