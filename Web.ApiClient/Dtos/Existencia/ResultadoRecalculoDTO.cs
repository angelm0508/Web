namespace Web.ApiClient.Dtos.Existencia
{
    /// <summary>Resultado de recalcular el comprometido y el pedido: filas revisadas y filas corregidas.</summary>
    public class ResultadoRecalculoDTO
    {
        public int Filas { get; set; }
        public int Corregidas { get; set; }
    }
}
