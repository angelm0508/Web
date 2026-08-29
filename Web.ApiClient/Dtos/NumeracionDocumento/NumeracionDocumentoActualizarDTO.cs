using System.ComponentModel.DataAnnotations;

namespace Web.ApiClient.Dtos.NumeracionDocumento
{
    public class NumeracionDocumentoActualizarDTO
    {
        [Display(Name = "Serie por defecto")]
        public int? SerieDfct { get; set; }

        [Display(Name = "Alias del documento")]
        public string? DocAlias { get; set; }

        [Display(Name = "Subtipo de documento")]
        public string? SubTipoDoc { get; set; }
    }
}
