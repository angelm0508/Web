using Web.ApiClient.Dtos.Departamento;
using Web.ApiClient.Dtos.DireccionSocioNegocio;
using Web.ApiClient.Dtos.Municipio;

namespace Web.UI.Models
{
    /// <summary>
    /// Arma la dirección de facturación de un socio para los documentos de compra y venta:
    /// «calle, bloque, municipio, departamento», con los nombres (no los códigos) y sin las partes vacías.
    /// </summary>
    public static class DireccionFacturacion
    {
        public const string TipoFacturacion = "FAC";

        /// <summary>
        /// Elige la dirección de tipo FAC con menor NumLinea (los nulos al final; desempate por código).
        /// Devuelve null si el socio no tiene ninguna dirección de facturación.
        /// </summary>
        public static DireccionSocioNegocioDTO? Elegir(IEnumerable<DireccionSocioNegocioDTO> direccionesDelSocio) =>
            direccionesDelSocio
                .Where(d => string.Equals(d.TipoDireccion?.Trim(), TipoFacturacion, StringComparison.OrdinalIgnoreCase))
                .OrderBy(d => d.NumLinea ?? int.MaxValue)
                .ThenBy(d => d.Direccion, StringComparer.Ordinal)
                .FirstOrDefault();

        /// <summary>
        /// Texto «calle, bloque, municipio, departamento». El código de municipio solo es único dentro de
        /// país + departamento, por eso se resuelve con esa combinación; si no se encuentra el nombre se usa el código.
        /// Devuelve cadena vacía si la dirección no tiene ninguna parte.
        /// </summary>
        public static string Armar(
            DireccionSocioNegocioDTO direccion,
            IEnumerable<MunicipioDTO> municipios,
            IEnumerable<DepartamentoDTO> departamentos)
        {
            var pais = direccion.Pais?.Trim();
            var codigoDepartamento = direccion.Departamento?.Trim();
            var codigoMunicipio = direccion.Municipio?.Trim();

            var nombreDepartamento = codigoDepartamento;
            if (!string.IsNullOrEmpty(codigoDepartamento))
            {
                var dep = departamentos.FirstOrDefault(d => d.Codigo == codigoDepartamento && (string.IsNullOrEmpty(pais) || d.Pais == pais));
                if (!string.IsNullOrWhiteSpace(dep?.Nombre)) nombreDepartamento = dep!.Nombre!.Trim();
            }

            var nombreMunicipio = codigoMunicipio;
            if (!string.IsNullOrEmpty(codigoMunicipio))
            {
                var mun = municipios.FirstOrDefault(m => m.Codigo == codigoMunicipio
                    && (string.IsNullOrEmpty(codigoDepartamento) || m.Departamento == codigoDepartamento)
                    && (string.IsNullOrEmpty(pais) || m.Pais == pais));
                if (!string.IsNullOrWhiteSpace(mun?.Nombre)) nombreMunicipio = mun!.Nombre.Trim();
            }

            var partes = new[] { direccion.Calle, direccion.Bloque, nombreMunicipio, nombreDepartamento }
                .Where(p => !string.IsNullOrWhiteSpace(p))
                .Select(p => p!.Trim());

            return string.Join(", ", partes);
        }
    }
}
