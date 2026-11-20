namespace Web.ApiClient.Dtos.Pos
{
    /// <summary>Cliente para «Cambiar cliente» del POS. Refleja <c>ClientePos</c> de la API.</summary>
    public class ClientePos
    {
        public string Codigo { get; set; } = string.Empty;
        public string Nombre { get; set; } = string.Empty;
        public string? Nit { get; set; }
        public int? NumLstPrecio { get; set; }
    }
}
