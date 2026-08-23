using System.ComponentModel.DataAnnotations;

namespace Web.ApiClient.Dtos.Articulo
{
    public class ArticuloActualizarDTO
    {
        // La API exige este campo en el body de actualización aunque el código real se toma de la
        // ruta (PUT api/Articulo/{codigo}) -- hay que enviarlo igual o la validación lo rechaza.
        public string Codigo { get; set; } = string.Empty;

        [Display(Name = "Nombre")]
        public string? Nombre { get; set; }

        [Display(Name = "Grupo")]
        public short? CodigoGrupo { get; set; }

        [Display(Name = "Grupo de unidad de medida")]
        public int? CodigoGrpUnidadMedida { get; set; }

        [Display(Name = "Fabricante")]
        public int? FabricanteEntry { get; set; }

        [Display(Name = "Activo")]
        public string? Activo { get; set; }

        [Display(Name = "Artículo de compra")]
        public string? ArticuloCompra { get; set; }

        [Display(Name = "Artículo de venta")]
        public string? ArticuloVenta { get; set; }

        [Display(Name = "Artículo de inventario")]
        public string? ArticuloInventario { get; set; }

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
        public string? NoApliDesc { get; set; }

        [Display(Name = "Gestiona número de serie")]
        public string? GestNoSerie { get; set; }

        [Display(Name = "Gestiona lote")]
        public string? GestLote { get; set; }

        [Display(Name = "Gestiona por almacén")]
        public string? GestPorAlmacen { get; set; }

        [Display(Name = "Mínimo")]
        public decimal? Minimo { get; set; }

        [Display(Name = "Máximo")]
        public decimal? Maximo { get; set; }

        [Display(Name = "Comentarios")]
        public string? Comentarios { get; set; }
    }
}
