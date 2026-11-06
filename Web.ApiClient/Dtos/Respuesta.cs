namespace Web.ApiClient.Dtos
{
    public class Respuesta<T>
    {
        public T? Dato { get; set; }
        public bool Resultado { get; set; }
        public string Mensaje { get; set; } = string.Empty;
        public List<ErrorValidacion> Errores { get; set; }
    }

    public class ErrorValidacion
    {
        public string Campo { get; set; }
        public string Mensaje { get; set; }
    }
}
