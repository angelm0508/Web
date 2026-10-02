namespace Web.ApiClient.Dtos.Usuario
{
    public class UsuarioDTO
    {
        public int Id { get; set; }
        public string Codigo { get; set; } = null!;
        public string? Nombre { get; set; }
        public string? SuperUsuario { get; set; }
        public string? Email { get; set; }
        public string? Bloqueado { get; set; }
    }
}
