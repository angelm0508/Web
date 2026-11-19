namespace Web.ApiClient.Dtos.Pos
{
    /// <summary>Artículo vendible en el POS (precio de la lista del cliente y existencias del almacén POS).</summary>
    public class ArticuloPos
    {
        public string Codigo { get; set; } = string.Empty;
        public string? CodigoBarras { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public decimal Precio { get; set; }
        public decimal Existencias { get; set; }
        public bool Inventariable { get; set; }
    }
}
