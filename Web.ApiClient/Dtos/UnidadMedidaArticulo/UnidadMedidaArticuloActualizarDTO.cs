using System.ComponentModel.DataAnnotations;

namespace Web.ApiClient.Dtos.UnidadMedidaArticulo
{
    public class UnidadMedidaArticuloActualizarDTO
    {
        // La API exige este campo en el body de actualización aunque el id real se toma de la ruta
        // (PUT api/UnidadMedidaArticulo/{id}) -- hay que enviarlo igual o la validación lo rechaza.
        public string Codigo { get; set; } = string.Empty;

        [Display(Name = "Nombre")]
        public string? Nombre { get; set; }

        [Display(Name = "Largo")]
        public decimal? Largo { get; set; }

        [Display(Name = "Ancho")]
        public decimal? Ancho { get; set; }

        [Display(Name = "Altura")]
        public decimal? Altura { get; set; }

        [Display(Name = "Volumen")]
        public decimal? Volumen { get; set; }

        [Display(Name = "Peso")]
        public decimal? Peso { get; set; }

        [Display(Name = "Bloqueado")]
        public string? Bloqueado { get; set; }
    }
}
