namespace Web.ApiClient.Dtos.Articulo
{
    public class UnidadArticuloDTO
    {
        public int UomEntry { get; set; }
        public string Codigo { get; set; } = null!;
        public string? Nombre { get; set; }
        public decimal Factor { get; set; }
        public bool EsBase { get; set; }
    }

    public class UnidadesArticuloDTO
    {
        public string CodArticulo { get; set; } = null!;
        public int? GrupoEntry { get; set; }
        public List<UnidadArticuloDTO> Unidades { get; set; } = new();
    }
}
