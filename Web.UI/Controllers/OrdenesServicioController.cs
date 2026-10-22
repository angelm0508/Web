using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Rendering;
using System.Linq;
using Web.ApiClient.Clientes;
using Web.ApiClient.Dtos;
using Web.ApiClient.Dtos.Articulo;
using Web.ApiClient.Dtos.Motocicleta;
using Web.ApiClient.Dtos.OrdenServicio;
using Web.UI.Authorization;

namespace Web.UI.Controllers
{
    [Authorize]
    public class OrdenesServicioController : Controller
    {
        private readonly IOrdenServicioApiClient _ordenes;
        private readonly IOrdenServicioDetalleApiClient _detalles;
        private readonly IMotocicletaApiClient _motos;
        private readonly IMecanicoApiClient _mecanicos;
        private readonly ISocioNegocioApiClient _socios;
        private readonly IMonedaApiClient _monedas;
        private readonly IArticuloApiClient _articulos;
        private readonly IAlmacenApiClient _almacenes;
        private readonly IImpuestoApiClient _impuestos;
        private readonly INumeracionDocumentoDetApiClient _series;
        private readonly INumeracionDocumentoApiClient _numeracion;

        // CodigoObj de NumeracionDocumento que identifica a "Órdenes de servicio" como tipo de objeto.
        private const string CodigoObjOrden = "70";
        private const string SubTipoDocOrden = "--";

        public OrdenesServicioController(
            IOrdenServicioApiClient ordenes,
            IOrdenServicioDetalleApiClient detalles,
            IMotocicletaApiClient motos,
            IMecanicoApiClient mecanicos,
            ISocioNegocioApiClient socios,
            IMonedaApiClient monedas,
            IArticuloApiClient articulos,
            IAlmacenApiClient almacenes,
            IImpuestoApiClient impuestos,
            INumeracionDocumentoDetApiClient series,
            INumeracionDocumentoApiClient numeracion)
        {
            _ordenes = ordenes;
            _detalles = detalles;
            _motos = motos;
            _mecanicos = mecanicos;
            _socios = socios;
            _monedas = monedas;
            _articulos = articulos;
            _almacenes = almacenes;
            _impuestos = impuestos;
            _series = series;
            _numeracion = numeracion;
        }

        [RequierePermiso("OrdenesServicio", Accion.Ver)]
        public IActionResult Index() => View();

        [HttpGet]
        [RequierePermiso("OrdenesServicio", Accion.Ver)]
        public async Task<IActionResult> ObtenerTodos(string? estado)
        {
            var respuesta = await _ordenes.ObtenerTodoAsync(estado);
            return Json(respuesta);
        }

        [HttpGet]
        [RequierePermiso("OrdenesServicio", Accion.Ver)]
        public async Task<IActionResult> ObtenerUno(int entry)
        {
            var respuesta = await _ordenes.ObtenerAsync(entry);
            return Json(respuesta);
        }

        [HttpGet]
        [RequierePermiso("OrdenesServicio", Accion.Agregar)]
        public async Task<IActionResult> FormularioCrear()
        {
            await CargarDropdownsAsync();
            var series = await _series.ObtenerPorDocumentoAsync(CodigoObjOrden);
            ViewBag.SeriesOrden = (series.Dato ?? []).Where(s => s.SubTipoDoc == SubTipoDocOrden);

            // Serie preseleccionada: la configurada como "por defecto" para este objeto en "Numeración de documentos".
            var numeraciones = await _numeracion.ObtenerTodoAsync();
            var numeracionActual = (numeraciones.Dato ?? []).FirstOrDefault(n => n.CodigoObj == CodigoObjOrden && n.SubTipoDoc == SubTipoDocOrden);
            ViewBag.SerieDefecto = numeracionActual?.SerieDfct;

            ViewBag.EsEdicion = false;
            // Las fechas nacen con el día de hoy: la orden se abre en el momento en que ingresa la moto.
            var dto = new OrdenServicioCrearDTO { FechaDoc = DateTime.Today, FechaIngreso = DateTime.Today };
            return PartialView("_Form", dto);
        }

        [HttpGet]
        [RequierePermiso("OrdenesServicio", Accion.Ver)]
        public async Task<IActionResult> FormularioEditar(int entry)
        {
            var respuesta = await _ordenes.ObtenerAsync(entry);
            if (!respuesta.Resultado || respuesta.Dato is null)
                return NotFound();

            var o = respuesta.Dato;
            await CargarDropdownsAsync(o.CodMecanico);
            ViewBag.EsEdicion = true;
            ViewBag.EntryActual = entry;
            ViewBag.NumDocActual = o.NumDoc;
            ViewBag.EstadoServicio = o.EstadoServicio;
            ViewBag.Cancelado = o.Cancelado ?? "N";
            ViewBag.TotalBruto = o.TotalBruto;
            ViewBag.TotalImp = o.TotalImp;
            ViewBag.TotalDoc = o.TotalDoc;

            var serieInfo = await _series.ObtenerAsync(o.Serie);
            ViewBag.NombreSerieActual = serieInfo.Resultado ? serieInfo.Dato?.NombreSerie : null;

            // Motos del cliente de la orden (la inactiva de la orden se conserva aunque ya no se ofrezca a otras).
            var motos = await _motos.BuscarAsync(o.CodigoSn, null);
            ViewBag.MotosCliente = (motos.Dato ?? []).Where(m => m.Activo == "S" || m.Entry == o.MotoEntry).ToList();

            var dto = new OrdenServicioCrearDTO
            {
                NumDoc = o.NumDoc,
                Serie = o.Serie,
                FechaDoc = o.FechaDoc,
                FechaIngreso = o.FechaIngreso,
                FechaPromesa = o.FechaPromesa,
                CodigoSn = o.CodigoSn,
                NombreSn = o.NombreSn,
                Direccion = o.Direccion,
                MonedaDoc = o.MonedaDoc,
                MotoEntry = o.MotoEntry,
                CodMecanico = o.CodMecanico,
                KmIngreso = o.KmIngreso,
                FallaReportada = o.FallaReportada,
                Diagnostico = o.Diagnostico,
                Observaciones = o.Observaciones,
                Comentario = o.Comentario
            };
            return PartialView("_Form", dto);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        [RequierePermiso("OrdenesServicio", Accion.Agregar)]
        public async Task<IActionResult> Crear([FromBody] OrdenServicioCrearDTO dto)
        {
            var respuesta = await _ordenes.InsertarAsync(dto);
            if (!respuesta.Resultado)
                return Json(respuesta);

            var creada = await _ordenes.ObtenerAsync(respuesta.Dato);
            return Json(new { respuesta.Resultado, respuesta.Mensaje, dato = respuesta.Dato, numDoc = creada.Dato?.NumDoc });
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        [RequierePermiso("OrdenesServicio", Accion.Actualizar)]
        public async Task<IActionResult> Editar(int entry, [FromBody] OrdenServicioActualizarDTO dto)
        {
            var respuesta = await _ordenes.ActualizarAsync(entry, dto);
            return Json(respuesta);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        [RequierePermiso("OrdenesServicio", Accion.Actualizar)]
        public async Task<IActionResult> CambiarEstado(int entry, string estado)
        {
            var respuesta = await _ordenes.CambiarEstadoAsync(entry, estado);
            return Json(respuesta);
        }

        // Cancelar una orden es anularla: requiere Eliminar (convención: 'cancelar documento -> Eliminar').
        [HttpPost]
        [ValidateAntiForgeryToken]
        [RequierePermiso("OrdenesServicio", Accion.Eliminar)]
        public async Task<IActionResult> Cancelar(int entry)
        {
            var respuesta = await _ordenes.CancelarAsync(entry);
            return Json(respuesta);
        }

        [HttpGet]
        [RequierePermiso("OrdenesServicio", Accion.Ver)]
        public async Task<IActionResult> ObtenerDetalle(int entry)
        {
            var respuesta = await _ordenes.ObtenerLineasAsync(entry);
            return Json(respuesta);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        [RequierePermiso("OrdenesServicio", Accion.Actualizar)]
        public async Task<IActionResult> CrearLinea([FromBody] OrdenServicioDetalleCrearDTO dto)
        {
            var respuesta = await _detalles.InsertarAsync(dto);
            return Json(respuesta);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        [RequierePermiso("OrdenesServicio", Accion.Actualizar)]
        public async Task<IActionResult> EditarLinea(int entry, int noLinea, [FromBody] OrdenServicioDetalleActualizarDTO dto)
        {
            var respuesta = await _detalles.ActualizarAsync(entry, noLinea, dto);
            return Json(respuesta);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        [RequierePermiso("OrdenesServicio", Accion.Actualizar)]
        public async Task<IActionResult> EliminarLinea(int entry, int noLinea)
        {
            var respuesta = await _detalles.EliminarAsync(entry, noLinea);
            return Json(respuesta);
        }

        // ---------------------------------------------------------------- buscadores del formulario

        [HttpGet]
        [RequierePermiso("OrdenesServicio", Accion.Ver)]
        public async Task<IActionResult> BuscarSocios(string texto)
        {
            var respuesta = string.IsNullOrEmpty(texto)
                ? await _socios.ObtenerTodoAsync("C")
                : await _socios.ObtenerContenganNombreAsync(texto, "C");
            return Json(respuesta);
        }

        /// <summary>tipo: "I" = solo insumos (artículos de inventario), "S" = solo servicios; sin tipo, ambos. Siempre activos y de venta.</summary>
        [HttpGet]
        [RequierePermiso("OrdenesServicio", Accion.Ver)]
        public async Task<IActionResult> BuscarArticulos(string texto, string? tipo)
        {
            var respuesta = string.IsNullOrEmpty(texto)
                ? await _articulos.ObtenerTodoAsync()
                : await _articulos.ObtenerContenganNombreAsync(texto);
            return Json(FiltrarArticulos(respuesta, tipo));
        }

        [HttpGet]
        [RequierePermiso("OrdenesServicio", Accion.Ver)]
        public async Task<IActionResult> BuscarArticulosPorCodigo(string texto, string? tipo)
        {
            var respuesta = string.IsNullOrEmpty(texto)
                ? await _articulos.ObtenerTodoAsync()
                : await _articulos.ObtenerContenganCodigoAsync(texto);
            return Json(FiltrarArticulos(respuesta, tipo));
        }

        [HttpGet]
        [RequierePermiso("OrdenesServicio", Accion.Ver)]
        public async Task<IActionResult> BuscarAlmacenes(string texto)
        {
            var respuesta = string.IsNullOrEmpty(texto)
                ? await _almacenes.ObtenerTodoAsync()
                : await _almacenes.ObtenerContenganNombreAsync(texto);
            return Json(respuesta);
        }

        [HttpGet]
        [RequierePermiso("OrdenesServicio", Accion.Ver)]
        public async Task<IActionResult> BuscarImpuestos(string texto)
        {
            var respuesta = string.IsNullOrEmpty(texto)
                ? await _impuestos.ObtenerTodoAsync()
                : await _impuestos.ObtenerContenganNombreAsync(texto);
            return Json(respuesta);
        }

        [HttpGet]
        [RequierePermiso("OrdenesServicio", Accion.Ver)]
        public async Task<IActionResult> ObtenerAlmacenPorCodigo(string codigo)
        {
            var respuesta = await _almacenes.ObtenerAsync(codigo);
            return Json(respuesta);
        }

        [HttpGet]
        [RequierePermiso("OrdenesServicio", Accion.Ver)]
        public async Task<IActionResult> ObtenerImpuestoPorCodigo(string codigo)
        {
            var respuesta = await _impuestos.ObtenerAsync(codigo);
            return Json(respuesta);
        }

        /// <summary>Motocicletas activas de un cliente, para el selector de la orden.</summary>
        [HttpGet]
        [RequierePermiso("OrdenesServicio", Accion.Ver)]
        public async Task<IActionResult> MotosDeCliente(string codigoSn)
        {
            var respuesta = await _motos.BuscarAsync(codigoSn, null);
            if (!respuesta.Resultado || respuesta.Dato is null)
                return Json(respuesta);

            return Json(new Respuesta<IEnumerable<MotocicletaDTO>>
            {
                Resultado = true,
                Mensaje = respuesta.Mensaje,
                Dato = respuesta.Dato.Where(m => m.Activo == "S").ToList()
            });
        }

        /// <summary>Registro rápido de una motocicleta desde el formulario de la orden.</summary>
        [HttpPost]
        [ValidateAntiForgeryToken]
        [RequierePermiso("Motocicletas", Accion.Agregar)]
        public async Task<IActionResult> CrearMoto([FromBody] MotocicletaCrearDTO dto)
        {
            var respuesta = await _motos.InsertarAsync(dto);
            return Json(respuesta);
        }

        private static Respuesta<IEnumerable<ArticuloDTO>> FiltrarArticulos(Respuesta<IEnumerable<ArticuloDTO>> origen, string? tipo)
        {
            if (!origen.Resultado || origen.Dato is null)
                return origen;

            var lista = origen.Dato.Where(a => a.Activo != "N" && a.ArticuloVenta == "S");
            lista = tipo switch
            {
                "I" => lista.Where(a => a.ArticuloInventario == "S"),
                "S" => lista.Where(a => a.ArticuloInventario != "S"),
                _ => lista
            };
            return new Respuesta<IEnumerable<ArticuloDTO>> { Resultado = true, Mensaje = origen.Mensaje, Dato = lista.ToList() };
        }

        private async Task CargarDropdownsAsync(string? codMecanicoActual = null)
        {
            // Socio, artículo, almacén e impuesto se consultan bajo demanda con el buscador (BuscarSocios,
            // BuscarArticulos, …). Moneda y mecánico son <select> normales.
            var monedas = await _monedas.ObtenerTodoAsync();
            ViewBag.Monedas = new SelectList(monedas.Dato ?? [], "Codigo", "Nombre");

            var mecanicos = await _mecanicos.ObtenerTodoAsync();
            // Un mecánico dado de baja ya no se ofrece para nuevas asignaciones, pero el asignado a la orden se conserva.
            var opcionesMecanicos = (mecanicos.Dato ?? [])
                .Where(m => m.Activo == "S" || m.Codigo == codMecanicoActual)
                .Select(m => new { m.Codigo, Nombre = m.Activo == "S" ? m.Nombre : $"{m.Nombre} (inactivo)" });
            ViewBag.Mecanicos = new SelectList(opcionesMecanicos, "Codigo", "Nombre");
        }
    }
}
