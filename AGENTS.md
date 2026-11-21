# AGENTS.md — Web de GESCOM

Guía para agentes de IA (y personas) que trabajan en este repositorio. Mantenla corta y actualizada. Estado y pendientes globales: `API/docs/traspaso-2026-11-07.md` (repo hermano `API`).

## Qué es
Interfaz web (ASP.NET Core 8 MVC) del sistema de gestión GESCOM. No tiene base de datos propia: todo pasa por la API REST del repo `API`. Frontend: Razor, jQuery, DataTables, Bootstrap 5, SweetAlert2.

## Estructura
- `Web.ApiClient`: clientes tipados por recurso (`Clientes/IXxxApiClient` + `XxxApiClient`) sobre `ApiClientBase`, y DTOs (`Dtos/<Modulo>/`) que **reflejan** los de la API (mismos nombres y tipos). Todas las respuestas son `Respuesta<T>` `{ Resultado, Mensaje, Dato }`; `ApiClientBase` convierte errores HTTP/excepciones en `Resultado = false` (nunca lanza).
- `Web.UI`: controladores (`Controllers/`), vistas (`Views/<Modulo>/`), JS por módulo (`wwwroot/js/<modulo>.js`) y helpers globales en `wwwroot/js/site.js` (objeto `App`).
- URL de la API: `ApiSettings:BaseUrl` en `Web.UI/appsettings.json` (por defecto `https://localhost:7264`).

## Convenciones
- **Permisos:** `[RequierePermiso("Modulo", Accion.Ver|Agregar|Actualizar|Eliminar)]` en cada acción y `User.TienePermiso("Modulo", Accion.X)` en las vistas. Las acciones POST llevan `[ValidateAntiForgeryToken]`; en JS usar `App.enviarJson(url, metodo, datos)`, que ya envía el token.
- Patrón de pantalla: listado con DataTable (`ajax: { url, dataSrc: App.dataSrcTabla }`), formularios en modal cargados por AJAX (`FormularioEditar` devuelve un parcial) o en página completa (`Crear`). Helpers: `App.mostrarError/mostrarExito`, `App.confirmarEliminar`, `App.recolectarFormulario`, `App.autocompletar` (buscador con sugerencias; `minCaracteres: 0` muestra la lista al enfocar el campo).
- **Escapa siempre** el texto dinámico que se inserta en HTML desde JS (hay listados antiguos que no lo hacen: es deuda conocida, no un patrón a imitar). En Razor no uses `Html.Raw` con datos.
- El `PUT` de socio de negocio reemplaza todas las columnas escalares: el formulario debe enviar siempre todos los valores actuales (incluidos límite de crédito, bloqueo por vencido y condición de pago).
- **Reportes:** una sola pantalla genérica (`Views/Reportes/Ver.cshtml` + `wwwroot/js/reportes.js`) que se arma desde la definición que devuelve la API; los reportes nuevos no llevan vista propia. El permiso lo evalúa la API por reporte (no hay `[RequierePermiso]` en `ReportesController`). Chart.js está empaquetado en `wwwroot/lib/chartjs` (sin CDN). Los filtros de socio, artículo y almacén usan los buscadores de esos módulos: el usuario necesita también `Ver` en ellos o la lista sale vacía (el texto escrito sin elegir opción se rechaza en pantalla).
- **NIT en documentos de compra y venta:** los 11 formularios (`Views/<Modulo>/_Form.cshtml`) llevan el campo `Nit` (`asp-for="Nit"`, máx. 15) junto a Dirección. Al elegir el socio, el `onSeleccion` del buscador lo llena con el `nit` del socio (solo si el campo no es de solo lectura); el usuario puede cambiarlo al crear y queda de solo lectura al editar (la API no lo actualiza). En «Copiar a» se precarga del documento base y las notas de crédito/débito lo copian de la factura base. Los `FormularioEditar` deben pasar `Nit` desde el DTO de consulta al formulario.
- **POS (punto de venta):** pantalla `Views/Pos/Index.cshtml` + `wwwroot/js/pos.js` (el núcleo de funciones puras se exporta como `Puro` y se prueba con node) y parcial `Views/Pos/_Ticket.cshtml`. `PosController` hace de proxy JSON hacia `api/Pos`: `Buscar`, `PorCodigo`, `Rapidos`, `Clientes`, `CrearCliente`, `Vender` (responde `{resultado, mensaje, dato, html, incierto}`: `html` es el ticket ya armado e `incierto` marca que no se sabe si la API llegó a registrar la venta), `Ticket` y `VentasDelDia`. El navegador solo estima el total; precios, impuesto y total los fija la API. Atajos: F2 buscar, F4 cliente, F9 cobrar, Esc nueva venta/cancelar. El ticket de 80 mm sale por CSS de impresión (`wwwroot/css/pos.css`). El cajero solo necesita `Pos.Ver`/`Pos.Agregar`: la pantalla se arma con `api/Pos/Contexto` y `api/Pos/Clientes` (no llama a formas de pago, impuestos ni socios). La configuración (`PosConfiguracionController`, `wwwroot/js/pos-configuracion.js`) NO permite guardar si falló la carga (si no, enviaría todo vacío y pisaría la configuración real). En el formulario de artículo el `PUT` debe enviar siempre `CodigoBarras` y `MostrarEnPos` ("S"/"N"), o se pierden en silencio. **Cliente nuevo rápido:** el modal «Cambiar cliente» busca por código, nombre o NIT y, con `Pos.Agregar` (`data-puede-cobrar`; sin él la vista no trae el botón ni el formulario), ofrece «Cliente nuevo» y, si la búsqueda no encontró nada, «Crear cliente "texto"»: un formulario dentro del mismo modal (Nombre máx. 200 y NIT máx. 15, obligatorios; Enter guarda) que llama a `POST /Pos/CrearCliente` (→ `api/Pos/Clientes`) y deja el cliente elegido como si se hubiera buscado (NIT en `#posNit`, repreciado). `Puro.precargarClienteNuevo(texto)` decide la precarga: lo que parece NIT (dígitos y guiones con una K final opcional, o `CF`) va al NIT; si tiene letras, al nombre. Los errores de la API se muestran en el formulario sin cerrar el modal. Reglas de negocio: `API/AGENTS.md` (viñeta POS).
- **Existencias: comprometido y pedido:** la API los mantiene sola despues de cada documento de venta/compra (`Existencias` muestra `Comprometido` y `Pedido` ya al dia). El boton «Recalcular comprometido y pedido» (`Views/Existencias/Index.cshtml` + `existencias.js` → `POST /Existencias/RecalcularCompromisos` → `api/Existencia/RecalcularCompromisos`) solo es visible con `Existencias` Actualizar y pide confirmacion; usalo unicamente para la carga inicial o para reparar diferencias, no como operacion diaria.
- Los selects obligatorios (fabricante, grupo, grupo de unidad de medida de artículos) no llevan opción vacía «-- Seleccione --».

## Comandos
```powershell
dotnet build Web.slnx
```
No hay proyecto de pruebas: se verifica con build y recorrido en navegador contra una API local. Si hay una Web en ejecución que bloquea `bin`, compila con `-p:BaseOutputPath="<carpeta temporal>\"` (los errores MSB3021/MSB3027 son bloqueo de archivos, no de compilación). Hay un warning CS8602 previo en `ArticulosController` que no es nuevo.

## Git
- Rama: `main`. Commits con rutas explícitas (`git add <archivo>`), **nunca** `git add -A` / `git add .`. **No hacer `push` salvo que el usuario lo pida.**
- Mensajes: `tipo(modulo): descripcion` en español, sin tildes. Conserva el fin de línea de cada archivo (autocrlf activo): no reformatear ni cambiar EOL.
- El código y los datos de ejemplo no deben incluir contraseñas ni claves reales.

## Cómo trabajar
- Cada función grande tiene su spec y plan en el repo `API` (`docs/superpowers/specs|plans`): léelos antes de tocar el módulo.
- Cambios de UI: verifícalos en el navegador (consola sin errores de producto, pestañas/modales, usuario con y sin permiso) y no cambies código ajeno al encargo.
