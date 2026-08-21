using System.ComponentModel.DataAnnotations;

namespace Web.ApiClient.Dtos.ListadoPrecio
{
    public class ListadoPrecioActualizarDTO
    {
        [Display(Name = "Nombre")]
        public string? Nombre { get; set; }

        [Display(Name = "Bloqueado")]
        public string? Bloqueado { get; set; }
    }
}
