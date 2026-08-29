namespace Web.ApiClient.Dtos.NumeracionDocumentoDet
{
    public class NumeracionDocumentoDetDTO
    {
        public string CodigoObj { get; set; } = string.Empty;
        public int Serie { get; set; }
        public string NombreSerie { get; set; } = string.Empty;
        public int? IniNumero { get; set; }
        public int? SigNumero { get; set; }
        public int? FinNumero { get; set; }
        public string? IniCadena { get; set; }
        public string? FinCadena { get; set; }
        public string? Comentario { get; set; }
        public string? Bloqueado { get; set; }
        public int? CantDigitos { get; set; }
        public string SubTipoDoc { get; set; } = string.Empty;
        public string TipoSerie { get; set; } = string.Empty;
        public string? Manual { get; set; }
    }
}
