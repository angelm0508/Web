using System.ComponentModel.DataAnnotations;

namespace Web.ApiClient.Dtos.Articulo
{
    public class ArticuloCrearDTO
    {
        // Solo es obligatorio con una serie "Manual" (lo valida la API: «El código es requerido para series manuales.»);
        // con las demás series el código lo asigna la API al guardar y este campo viaja vacío.
        [Display(Name = "Código")]
        public string? Codigo { get; set; }

        [Display(Name = "Nombre")]
        [Required(ErrorMessage = "El campo {0} es requerido.")]
        public string? Nombre { get; set; }

        [Display(Name = "Grupo")]
        [Required(ErrorMessage = "El campo {0} es requerido.")]
        public short? CodigoGrupo { get; set; }

        [Display(Name = "Grupo de unidad de medida")]
        [Required(ErrorMessage = "El campo {0} es requerido.")]
        public int? CodigoGrpUnidadMedida { get; set; }

        [Display(Name = "Fabricante")]
        [Required(ErrorMessage = "El campo {0} es requerido.")]
        public int? FabricanteEntry { get; set; }

        [Display(Name = "Activo")]
        [Required(ErrorMessage = "El campo {0} es requerido.")]
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

        // Código del lector de barras (máx. 50; la API recorta, guarda vacío como NULL y rechaza duplicados).
        [Display(Name = "Código de barras")]
        public string? CodigoBarras { get; set; }

        // "S"/"N": si el artículo aparece en la cuadrícula rápida del POS. Sin valor por defecto a propósito: si el cuerpo
        // no lo trae, la edición conserva el valor actual (ArticulosController.Editar) y la creación usa "N".
        [Display(Name = "Mostrar en el POS")]
        public string? MostrarEnPos { get; set; }

        [Required(ErrorMessage = "La serie es requerida.")]
        [Display(Name = "Serie")]
        public int Serie { get; set; }
    }
}
