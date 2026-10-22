namespace Web.ApiClient.Dtos.OrdenServicio
{
    public class OrdenServicioDetalleCrearDTO
    {
        // Entry solo lo usa POST api/OrdenServicioDetalle; dentro de OrdenServicioCrearDTO.Lineas lo asigna el servidor.
        public int Entry { get; set; }
        public string? CodArticulo { get; set; }
        public string? Descripcion { get; set; }
        public string? CodAlmacen { get; set; }
        public decimal? Cantidad { get; set; }
        public decimal? Precio { get; set; }
        public decimal? PrctjeDesc { get; set; }
        public string? CodigoImpuesto { get; set; }
        public string? CodMecanico { get; set; }
    }
}
