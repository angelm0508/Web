namespace Web.ApiClient.Dtos.FabricanteArticulo
{
    public class FabricanteArticuloDTO
    {
        public int Entry { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public string? Bloqueado { get; set; }
    }
}
