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
