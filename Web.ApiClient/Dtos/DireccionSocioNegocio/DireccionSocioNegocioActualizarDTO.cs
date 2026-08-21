using System.ComponentModel.DataAnnotations;

namespace Web.ApiClient.Dtos.DireccionSocioNegocio
{
    public class DireccionSocioNegocioActualizarDTO
    {
        [Display(Name = "Calle")]
        public string? Calle { get; set; }

        [Display(Name = "Bloque")]
        public string? Bloque { get; set; }

        [Display(Name = "Código postal")]
        public string? CodigoPostal { get; set; }

        [Display(Name = "País")]
        public string? Pais { get; set; }

        [Display(Name = "Municipio")]
        public string? Municipio { get; set; }

        [Display(Name = "Departamento")]
        public string? Departamento { get; set; }

        [Display(Name = "Número de línea")]
        public int? NumLinea { get; set; }

        [Display(Name = "Tipo de dirección")]
        public string? TipoDireccion { get; set; }
    }
}
