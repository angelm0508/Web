namespace Web.UI.Models.Home
{
    public class DashboardViewModel
    {
        public string NombreUsuario { get; set; } = string.Empty;

        public int TotalArticulos { get; set; }
        public int TotalSociosNegocio { get; set; }
        public int TotalCotizaciones { get; set; }
        public int TotalArticulosStockBajo { get; set; }

        public List<ArticuloTopViewModel> TopArticulosPorPrecio { get; set; } = new();
        public List<TransaccionRecienteViewModel> UltimasCotizaciones { get; set; } = new();
        public List<ArticuloStockBajoViewModel> ArticulosStockBajo { get; set; } = new();
        public List<AlmacenBajoMinimoViewModel> AlmacenesBajoMinimo { get; set; } = new();
    }

    public class ArticuloTopViewModel
    {
        public string Nombre { get; set; } = string.Empty;
        public decimal Precio { get; set; }
        public int PorcentajeBarra { get; set; }
    }

    public class TransaccionRecienteViewModel
    {
        public int NumDoc { get; set; }
        public string? NombreSn { get; set; }
        public string? Estado { get; set; }
        public decimal? Total { get; set; }
    }

    public class ArticuloStockBajoViewModel
    {
        public string Codigo { get; set; } = string.Empty;
        public string? Nombre { get; set; }
        public decimal? CantDisponible { get; set; }
        public decimal? Minimo { get; set; }
    }

    /// <summary>Artículo cuyo stock en un almacén concreto está por debajo del mínimo configurado para ese almacén.</summary>
    public class AlmacenBajoMinimoViewModel
    {
        public string CodArticulo { get; set; } = string.Empty;
        public string? NombreArticulo { get; set; }
        public string CodAlmacen { get; set; } = string.Empty;
        public string? NombreAlmacen { get; set; }
        public decimal EnStock { get; set; }
        public decimal Minimo { get; set; }
    }
}
