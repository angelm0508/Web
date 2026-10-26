using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Rendering;
using Web.ApiClient.Clientes;
using Web.ApiClient.Dtos.DireccionSocioNegocio;
using Web.ApiClient.Dtos.EstadoCuenta;
using Web.ApiClient.Dtos.SocioNegocio;
using Web.UI.Authorization;

namespace Web.UI.Controllers
{
    [Authorize]
    public class SociosNegocioController : Controller
    {
        private readonly ISocioNegocioApiClient _socios;
        private readonly IGrupoSnApiClient _grupos;
        private readonly IListadoPrecioApiClient _listadosPrecio;
        private readonly IDireccionSocioNegocioApiClient _direcciones;
        private readonly IPaisApiClient _paises;
        private readonly IDepartamentoApiClient _departamentos;
        private readonly IMunicipioApiClient _municipios;
        private readonly INumeracionDocumentoDetApiClient _series;
        private readonly ICondicionPagoApiClient _condicionesPago;
        private readonly IEstadoCuentaApiClient _estadoCuenta;

        // Máximo de socios que acepta la API por llamada a EstadoCuenta/Saldos.
        private const int MaximoSociosPorLlamadaSaldos = 500;

        // CodigoObj de NumeracionDocumento que identifica a "Socios de negocio" como tipo de objeto.
        private const string CodigoObjSocioNegocio = "1";

        public SociosNegocioController(
            ISocioNegocioApiClient socios,
            IGrupoSnApiClient grupos,
            IListadoPrecioApiClient listadosPrecio,
            IDireccionSocioNegocioApiClient direcciones,
            IPaisApiClient paises,
            IDepartamentoApiClient departamentos,
            IMunicipioApiClient municipios,
            INumeracionDocumentoDetApiClient series,
            ICondicionPagoApiClient condicionesPago,
            IEstadoCuentaApiClient estadoCuenta)
        {
            _socios = socios;
            _grupos = grupos;
            _listadosPrecio = listadosPrecio;
            _direcciones = direcciones;
            _paises = paises;
            _departamentos = departamentos;
            _municipios = municipios;
            _series = series;
            _condicionesPago = condicionesPago;
            _estadoCuenta = estadoCuenta;
        }

        [RequierePermiso("SociosNegocio", Accion.Ver)]
        public IActionResult Index() => View();

        [HttpGet]
        [RequierePermiso("SociosNegocio", Accion.Ver)]
        public async Task<IActionResult> ObtenerTodos()
        {
            var respuesta = await _socios.ObtenerTodoAsync();
            if (respuesta.Resultado && respuesta.Dato is not null && User.TienePermiso("EstadoCuenta", Accion.Ver))
            {
                // Saldo y vencido de todo el listado (en bloques de hasta 500 socios por llamada);
                // si falla, el listado sale sin esas columnas. Sin permiso de Ver en EstadoCuenta no se piden.
                var lista = respuesta.Dato.ToList();
                var saldos = await ObtenerSaldosAsync(lista.Select(s => s.Codigo));
                foreach (var s in lista)
                {
                    if (!saldos.TryGetValue(s.Codigo, out var saldo)) continue;
                    s.Saldo = saldo.Saldo;
                    s.Vencido = saldo.Vencido;
                }
                respuesta.Dato = lista;
            }
            return Json(respuesta);
        }

        [HttpGet]
        [RequierePermiso("SociosNegocio", Accion.Agregar)]
        public async Task<IActionResult> Crear()
        {
            await CargarDropdownsAsync();
            await CargarUbicacionesAsync();
            await CargarSeriesAsync();
            return View(new SocioNegocioCrearDTO { Activo = "S" });
        }

        [HttpGet]
        [RequierePermiso("SociosNegocio", Accion.Ver)]
        public async Task<IActionResult> FormularioEditar(string codigo)
        {
            var respuesta = await _socios.ObtenerAsync(codigo);
            if (!respuesta.Resultado || respuesta.Dato is null)
                return NotFound();

            await CargarDropdownsAsync();
            await CargarUbicacionesAsync();
            ViewBag.EsEdicion = true;

            var serieInfo = await _series.ObtenerAsync(respuesta.Dato.Serie);
            ViewBag.NombreSerieActual = serieInfo.Resultado ? serieInfo.Dato?.NombreSerie : null;
            ViewBag.NombreTipoActual = respuesta.Dato.TipoSn == "C" ? "Cliente" : (respuesta.Dato.TipoSn == "P" ? "Proveedor" : null);

            var dto = new SocioNegocioCrearDTO
            {
                Codigo = codigo,
                Nombre = respuesta.Dato.Nombre,
                TipoSn = respuesta.Dato.TipoSn,
                GrupoSn = respuesta.Dato.GrupoSn,
                Cui = respuesta.Dato.Cui,
                Nit = respuesta.Dato.Nit,
                PersContacto = respuesta.Dato.PersContacto,
                Tel1 = respuesta.Dato.Tel1,
                Tel2 = respuesta.Dato.Tel2,
                Descuento = respuesta.Dato.Descuento,
                NumLstPrecio = respuesta.Dato.NumLstPrecio,
                // Siempre se precarga la condición actual: la actualización de la API reemplaza todas las columnas.
                CondicionPago = respuesta.Dato.CondicionPago,
                Email = respuesta.Dato.Email,
                Activo = respuesta.Dato.Activo,
                Serie = respuesta.Dato.Serie
            };
            AgregarCondicionActualSiFalta(dto.CondicionPago);

            // Saldo y vencido del socio solo para quien puede ver el estado de cuenta; si la llamada falla, la ficha solo muestra el enlace.
            if (User.TienePermiso("EstadoCuenta", Accion.Ver))
            {
                ViewBag.PuedeVerEstadoCuenta = true;
                var saldos = await ObtenerSaldosAsync([codigo]);
                if (saldos.TryGetValue(codigo, out var saldo))
                    ViewBag.SaldoSocio = saldo;
            }

            return PartialView("_Form", dto);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        [RequierePermiso("SociosNegocio", Accion.Agregar)]
        public async Task<IActionResult> Crear([FromBody] SocioNegocioCrearDTO dto)
        {
            var respuesta = await _socios.InsertarAsync(dto);
            // "respuesta.Dato" ya es el código real (para series no manuales, el que calculó la
            // API al momento de registrar -- no el de la vista previa mostrada antes de guardar).
            // El JS lo necesita para crear las direcciones acumuladas con el CodigoSn correcto.
            return Json(new { respuesta.Resultado, respuesta.Mensaje, codigo = respuesta.Dato });
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        [RequierePermiso("SociosNegocio", Accion.Actualizar)]
        public async Task<IActionResult> Editar(string codigo, [FromBody] SocioNegocioCrearDTO dto)
        {
            // La serie no se edita desde este formulario (solo se muestra a modo informativo) --
            // se conserva el valor actual del socio en vez de confiar en lo que llegue.
            var actual = await _socios.ObtenerAsync(codigo);
            if (!actual.Resultado || actual.Dato is null)
                return NotFound(actual);

            var actualizar = new SocioNegocioActualizarDTO
            {
                Serie = actual.Dato.Serie,
                Nombre = dto.Nombre,
                TipoSn = dto.TipoSn,
                GrupoSn = dto.GrupoSn,
                Cui = dto.Cui,
                Nit = dto.Nit,
                PersContacto = dto.PersContacto,
                Tel1 = dto.Tel1,
                Tel2 = dto.Tel2,
                Descuento = dto.Descuento,
                NumLstPrecio = dto.NumLstPrecio,
                CondicionPago = dto.CondicionPago,
                Email = dto.Email,
                Activo = dto.Activo
            };

            var respuesta = await _socios.ActualizarAsync(codigo, actualizar);
            return Json(respuesta);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        [RequierePermiso("SociosNegocio", Accion.Eliminar)]
        public async Task<IActionResult> Eliminar(string codigo)
        {
            var respuesta = await _socios.EliminarAsync(codigo);
            return Json(respuesta);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        [RequierePermiso("SociosNegocio", Accion.Agregar)]
        public async Task<IActionResult> CrearDireccion([FromBody] DireccionSocioNegocioCrearDTO dto)
        {
            var respuesta = await _direcciones.InsertarAsync(dto);
            return Json(respuesta);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        [RequierePermiso("SociosNegocio", Accion.Actualizar)]
        public async Task<IActionResult> EditarDireccion(string direccion, [FromBody] DireccionSocioNegocioActualizarDTO dto)
        {
            var respuesta = await _direcciones.ActualizarAsync(direccion, dto);
            return Json(respuesta);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        [RequierePermiso("SociosNegocio", Accion.Eliminar)]
        public async Task<IActionResult> EliminarDireccion(string direccion)
        {
            var respuesta = await _direcciones.EliminarAsync(direccion);
            return Json(respuesta);
        }

        private async Task CargarDropdownsAsync()
        {
            var grupos = await _grupos.ObtenerTodoAsync();
            var listadosPrecio = await _listadosPrecio.ObtenerTodoAsync();

            // El grupo depende del tipo de socio (Cliente/Proveedor) elegido, así que se pasa el
            // catálogo completo (igual que las series) para filtrarlo en el navegador según el
            // TipoSn seleccionado, en vez de un <select> estático con todos los grupos mezclados.
            ViewBag.GruposSocioNegocio = grupos.Dato ?? [];
            ViewBag.ListadosPrecio = new SelectList(listadosPrecio.Dato ?? [], "Entry", "Nombre");

            // Solo condiciones activas: la API no permite asignar una inactiva a un socio.
            var condiciones = await _condicionesPago.ObtenerTodoAsync();
            ViewBag.CondicionesPago = (condiciones.Dato ?? [])
                .Where(c => c.Activo == "S")
                .OrderBy(c => c.Dias).ThenBy(c => c.Nombre)
                .Select(c => new SelectListItem($"{c.Nombre} ({c.Dias} días)", c.Codigo))
                .ToList();
        }

        /// <summary>
        /// Si la condición actual del socio ya no está activa, se agrega al select (marcada) para no
        /// perderla en silencio al guardar; la API rechazará guardarla hasta que se elija otra.
        /// </summary>
        private void AgregarCondicionActualSiFalta(string? condicionActual)
        {
            if (string.IsNullOrWhiteSpace(condicionActual)) return;
            var opciones = (List<SelectListItem>)ViewBag.CondicionesPago;
            if (!opciones.Any(o => o.Value == condicionActual))
                opciones.Add(new SelectListItem($"{condicionActual} (inactiva)", condicionActual));
        }

        /// <summary>Saldos de los socios pedidos, en bloques de <see cref="MaximoSociosPorLlamadaSaldos"/> por llamada; los bloques que fallen quedan sin datos.</summary>
        private async Task<Dictionary<string, SaldoSocioDTO>> ObtenerSaldosAsync(IEnumerable<string> codigos)
        {
            var resultado = new Dictionary<string, SaldoSocioDTO>();
            foreach (var bloque in codigos.Distinct().Chunk(MaximoSociosPorLlamadaSaldos))
            {
                var respuesta = await _estadoCuenta.ObtenerSaldosAsync(bloque);
                if (!respuesta.Resultado || respuesta.Dato is null) continue;
                foreach (var s in respuesta.Dato)
                    resultado[s.CodigoSn] = s;
            }
            return resultado;
        }

        private async Task CargarUbicacionesAsync()
        {
            var paises = await _paises.ObtenerTodoAsync();
            var departamentos = await _departamentos.ObtenerTodoAsync();
            var municipios = await _municipios.ObtenerTodoAsync();

            // Mismo patrón que Almacenes: País se renderiza como <select> normal; Departamento y
            // Municipio dependen en cascada del país/departamento elegido, así que se pasan las
            // listas completas para filtrarlas en el navegador (catálogos pequeños).
            ViewBag.Paises = new SelectList(paises.Dato ?? [], "Codigo", "Nombre");
            ViewBag.Departamentos = departamentos.Dato ?? [];
            ViewBag.Municipios = municipios.Dato ?? [];
        }

        private async Task CargarSeriesAsync()
        {
            // Se traen todas las series del objeto "Socios de negocio" (ambos subtipos, C y P) y
            // se filtran en el navegador según el TipoSn elegido, igual que País/Departamento/Municipio.
            var respuesta = await _series.ObtenerPorDocumentoAsync(CodigoObjSocioNegocio);
            ViewBag.SeriesSocioNegocio = respuesta.Dato ?? [];
        }
    }
}
