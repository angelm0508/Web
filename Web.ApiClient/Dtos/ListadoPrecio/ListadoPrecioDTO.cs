namespace Web.ApiClient.Dtos.ListadoPrecio
{
    public class ListadoPrecioDTO
    {
        public int Entry { get; set; }
        public string? Nombre { get; set; }
        public int? Base { get; set; }
        public decimal? Factor { get; set; }
        public short? MetodoRedondeo { get; set; }
        public string? ReglaRedondeo { get; set; }
    }
}
