using System.ComponentModel.DataAnnotations;

namespace Web.ApiClient.Dtos.NumeracionDocumento
{
    public class NumeracionDocumentoCrearDTO
    {
        [Required(ErrorMessage = "El código es requerido.")]
        [Display(Name = "Código")]
        public string CodigoObj { get; set; } = string.Empty;

        [Display(Name = "Serie por defecto")]
        public int? SerieDfct { get; set; }

        [Display(Name = "Alias del documento")]
        public string? DocAlias { get; set; }

        [Required(ErrorMessage = "El subtipo de documento es requerido.")]
        [Display(Name = "Subtipo de documento")]
        public string SubTipoDoc { get; set; } = string.Empty;
    }
}
