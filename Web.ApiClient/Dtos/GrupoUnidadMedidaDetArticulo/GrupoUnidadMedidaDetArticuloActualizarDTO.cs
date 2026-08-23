using System.ComponentModel.DataAnnotations;

namespace Web.ApiClient.Dtos.GrupoUnidadMedidaDetArticulo
{
    public class GrupoUnidadMedidaDetArticuloActualizarDTO
    {
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
        public string? Activo { get; set; }
    }
}
