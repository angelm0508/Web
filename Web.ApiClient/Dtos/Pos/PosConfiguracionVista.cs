namespace Web.ApiClient.Dtos.Pos
{
    /// <summary>Configuración más la lista de campos que aún faltan para poder vender. Refleja <c>PosConfiguracionVista</c>.</summary>
    public class PosConfiguracionVista
    {
        public PosConfiguracionDato Configuracion { get; set; } = new();
        public List<string> Faltantes { get; set; } = new();
    }
}
