namespace Web.ApiClient.Dtos.Mecanico
{
    public class MecanicoActualizarDTO
    {
        public string Nombre { get; set; } = null!;
        public string? Telefono { get; set; }
        public string? Activo { get; set; }
    }
}
