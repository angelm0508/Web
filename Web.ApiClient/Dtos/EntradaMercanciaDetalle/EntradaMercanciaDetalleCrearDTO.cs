using System.ComponentModel.DataAnnotations;

namespace Web.ApiClient.Dtos.EntradaMercanciaDetalle
{
    public class EntradaMercanciaDetalleCrearDTO
    {
        [Required(ErrorMessage = "{0} campo no debe de estar vacio.")]
        public int Entry { get; set; }

        public int? NoLinea { get; set; }
        public string? CodArticulo { get; set; }
        public string? Descripcion { get; set; }
        public decimal? Cantidad { get; set; }
        public decimal? CostoUnitario { get; set; }
        public decimal? TotalLinea { get; set; }
        public string? CodAlmacen { get; set; }
    }
}
