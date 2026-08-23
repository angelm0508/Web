using System.ComponentModel.DataAnnotations;

namespace Web.ApiClient.Dtos.GrupoUnidadMedidaDetArticulo
{
    public class GrupoUnidadMedidaDetArticuloCrearDTO
    {
        [Required(ErrorMessage = "El grupo es requerido.")]
        [Display(Name = "Grupo")]
        public int GrpMedidaEntry { get; set; }

        [Required(ErrorMessage = "La unidad es requerida.")]
        [Display(Name = "Unidad")]
        public int MedidaEntry { get; set; }

        [Display(Name = "Cantidad alternativa")]
        public decimal? CantAlternativa { get; set; }

        [Display(Name = "Cantidad base")]
        public decimal? CantBase { get; set; }

        [Display(Name = "Factor de peso")]
        public int? PesoFactor { get; set; }

        [Display(Name = "Factor UDF")]
        public int? UdfFactor { get; set; }

        [Display(Name = "Activo")]
        public string? Activo { get; set; } = "S";
    }
}
