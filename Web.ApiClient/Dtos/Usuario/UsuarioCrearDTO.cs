namespace Web.ApiClient.Dtos.Usuario
{
    public class UsuarioCrearDTO
    {
        public string Codigo { get; set; } = null!;
        public string Nombre { get; set; } = null!;
        public string Password { get; set; } = null!;
        public string? Email { get; set; }
        public string? SuperUsuario { get; set; }
        public string? Bloqueado { get; set; }
    }
}
