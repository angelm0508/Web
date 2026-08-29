using System.ComponentModel.DataAnnotations;

namespace Web.ApiClient.Dtos.SocioNegocio
{
    public class SocioNegocioCrearDTO
    {
        [Display(Name = "Código")]
        public string? Codigo { get; set; }

        [Display(Name = "Nombre")]
        public string? Nombre { get; set; }

        [Display(Name = "Tipo")]
        public string? TipoSn { get; set; }

        [Display(Name = "Grupo")]
        public short? GrupoSn { get; set; }

        [Display(Name = "CUI")]
        public string? Cui { get; set; }

        [Display(Name = "NIT")]
        public string? Nit { get; set; }

        [Display(Name = "Persona de contacto")]
        public string? PersContacto { get; set; }

        [Display(Name = "Teléfono 1")]
        public string? Tel1 { get; set; }

        [Display(Name = "Teléfono 2")]
        public string? Tel2 { get; set; }

        [Display(Name = "Descuento")]
        public decimal? Descuento { get; set; }

        [Display(Name = "Listado de precio")]
        public int? NumLstPrecio { get; set; }

        [Display(Name = "Correo")]
        [EmailAddress(ErrorMessage = "El correo no es válido.")]
        public string? Email { get; set; }

        [Display(Name = "Activo")]
        public string? Activo { get; set; } = "S";

        [Required(ErrorMessage = "La serie es requerida.")]
        [Display(Name = "Serie")]
        public int Serie { get; set; }
    }
}
