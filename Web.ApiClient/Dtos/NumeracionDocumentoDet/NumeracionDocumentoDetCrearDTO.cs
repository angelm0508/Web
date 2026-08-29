using System.ComponentModel.DataAnnotations;

namespace Web.ApiClient.Dtos.NumeracionDocumentoDet
{
    public class NumeracionDocumentoDetCrearDTO
    {
        [Required(ErrorMessage = "El documento es requerido.")]
        [Display(Name = "Código de documento")]
        public string CodigoObj { get; set; } = string.Empty;

        [Required(ErrorMessage = "La serie es requerida.")]
        [Display(Name = "Serie")]
        public int Serie { get; set; }

        [Required(ErrorMessage = "El nombre de la serie es requerido.")]
        [Display(Name = "Nombre de serie")]
        public string NombreSerie { get; set; } = string.Empty;

        [Display(Name = "Número inicial")]
        public int? IniNumero { get; set; }

        [Display(Name = "Número siguiente")]
        public int? SigNumero { get; set; }

        [Display(Name = "Número final")]
        public int? FinNumero { get; set; }

        [Display(Name = "Cadena inicial")]
        public string? IniCadena { get; set; }

        [Display(Name = "Cadena final")]
        public string? FinCadena { get; set; }

        [Display(Name = "Comentario")]
        public string? Comentario { get; set; }

        [Display(Name = "Bloqueado")]
        public string? Bloqueado { get; set; } = "N";

        [Display(Name = "Cantidad de dígitos")]
        public int? CantDigitos { get; set; }

        [Required(ErrorMessage = "El subtipo de documento es requerido.")]
        [Display(Name = "Subtipo de documento")]
        public string SubTipoDoc { get; set; } = string.Empty;

        [Required(ErrorMessage = "El tipo de serie es requerido.")]
        [Display(Name = "Tipo de serie")]
        public string TipoSerie { get; set; } = string.Empty;

        [Display(Name = "Manual")]
        public string? Manual { get; set; } = "N";
    }
}
