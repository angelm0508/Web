using System.ComponentModel.DataAnnotations;

namespace Web.ApiClient.Dtos.Articulo
{
    public class ArticuloCrearDTO
    {
        [Display(Name = "Código")]
        public string? Codigo { get; set; }

        [Display(Name = "Nombre")]
        public string? Nombre { get; set; }

        [Display(Name = "Grupo")]
        public short? CodigoGrupo { get; set; }

        [Display(Name = "Grupo de unidad de medida")]
        public int? CodigoGrpUnidadMedida { get; set; }

        [Display(Name = "Fabricante")]
        public int? FabricanteEntry { get; set; }

        [Display(Name = "Activo")]
        public string? Activo { get; set; } = "S";

        [Display(Name = "Artículo de compra")]
        public string? ArticuloCompra { get; set; } = "S";

        [Display(Name = "Artículo de venta")]
        public string? ArticuloVenta { get; set; } = "S";

        [Display(Name = "Artículo de inventario")]
        public string? ArticuloInventario { get; set; } = "S";

        [Display(Name = "Precio unitario")]
        public decimal? PrecioUnitario { get; set; }

        [Display(Name = "Cantidad disponible")]
        public decimal? CantDisponible { get; set; }

        [Display(Name = "Cantidad confirmada")]
        public decimal? CantConfirmada { get; set; }

        [Display(Name = "Cantidad pedida")]
        public decimal? CantPedida { get; set; }

        [Display(Name = "Almacén por defecto")]
        public string? AlmacenDefecto { get; set; }

        [Display(Name = "No aplica descuento")]
        public string? NoApliDesc { get; set; } = "N";

        [Display(Name = "Gestiona número de serie")]
        public string? GestNoSerie { get; set; } = "N";

        [Display(Name = "Gestiona lote")]
        public string? GestLote { get; set; } = "N";

        [Display(Name = "Gestiona por almacén")]
        public string? GestPorAlmacen { get; set; } = "N";

        [Display(Name = "Mínimo")]
        public decimal? Minimo { get; set; }

        [Display(Name = "Máximo")]
        public decimal? Maximo { get; set; }

        [Display(Name = "Comentarios")]
        public string? Comentarios { get; set; }

        [Required(ErrorMessage = "La serie es requerida.")]
        [Display(Name = "Serie")]
        public int Serie { get; set; }
    }
}
