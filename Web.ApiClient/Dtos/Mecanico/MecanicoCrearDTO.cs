namespace Web.ApiClient.Dtos.Mecanico
{
    public class MecanicoCrearDTO
    {
        public string Codigo { get; set; } = null!;
        public string Nombre { get; set; } = null!;
        public string? Telefono { get; set; }
        public string? Activo { get; set; }
    }
}
