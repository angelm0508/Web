using System.ComponentModel.DataAnnotations;
using Web.ApiClient.Dtos.SalidaMercanciaDetalle;

namespace Web.ApiClient.Dtos.SalidaMercancia
{
    public class SalidaMercanciaCrearDTO
    {
        // Requerido solo para series "Manual" -- para series autogeneradas la API calcula el
        // siguiente número al registrar la salida de mercancía, así que aquí no puede ser obligatorio.
        public int? NumDoc { get; set; }

        [Required(ErrorMessage = "{0} campo no debe de estar vacio.")]
        public int Serie { get; set; }

        public string? NumManual { get; set; }
        public DateTime? FechaDoc { get; set; }
        public DateTime? FechaContab { get; set; }
        public string? Referencia { get; set; }
        public string? Comentario { get; set; }
        public string? Cancelado { get; set; }
        public List<SalidaMercanciaDetalleCrearDTO> Lineas { get; set; } = new();
    }
}
