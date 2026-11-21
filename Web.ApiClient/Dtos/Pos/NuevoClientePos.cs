namespace Web.ApiClient.Dtos.Pos
{
    /// <summary>«Cliente nuevo» rápido del POS (nombre y NIT). Refleja <c>NuevoClientePos</c> de la API.</summary>
    public class NuevoClientePos
    {
        public string? Nombre { get; set; }
        public string? Nit { get; set; }
    }
}
