namespace Web.ApiClient.Dtos.NumeracionDocumento
{
    public class NumeracionDocumentoDTO
    {
        public string CodigoObj { get; set; } = string.Empty;
        public int? SerieDfct { get; set; }
        public string? DocAlias { get; set; }
        public string SubTipoDoc { get; set; } = string.Empty;
    }
}
