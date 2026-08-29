using System.ComponentModel.DataAnnotations;

namespace Web.ApiClient.Dtos.ListadoPrecio
{
    public class ListadoPrecioActualizarDTO
    {
        [Display(Name = "Nombre")]
        public string? Nombre { get; set; }

        [Display(Name = "Lista de precio base")]
        public int? Base { get; set; }

        [Display(Name = "Factor por defecto")]
        public decimal? Factor { get; set; }

        [Display(Name = "Método de redondeo")]
        public short? MetodoRedondeo { get; set; }

        [Display(Name = "Regla de redondeo")]
        public string? ReglaRedondeo { get; set; }
    }
}
