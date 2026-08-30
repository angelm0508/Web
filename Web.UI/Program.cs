using Microsoft.AspNetCore.Authentication.Cookies;
using System.Text.Json.Serialization;
using Web.ApiClient.Autenticacion;
using Web.ApiClient.Clientes;
using Web.ApiClient.Configuracion;

var builder = WebApplication.CreateBuilder(args);

// Los formularios envían todos sus campos como texto (incluidos los numéricos, vía
// App.recolectarFormulario); sin esto, System.Text.Json rechaza un "10.50" entre comillas
// para una propiedad decimal/int del lado del servidor.
builder.Services.AddControllersWithViews()
    .AddJsonOptions(options => options.JsonSerializerOptions.NumberHandling = JsonNumberHandling.AllowReadingFromString);

builder.Services.Configure<ApiSettings>(builder.Configuration.GetSection(ApiSettings.SeccionConfiguracion));
var apiBaseUrl = builder.Configuration.GetSection(ApiSettings.SeccionConfiguracion)["BaseUrl"]
    ?? throw new InvalidOperationException("Falta configurar ApiSettings:BaseUrl en appsettings.json.");

builder.Services.AddHttpContextAccessor();
builder.Services.AddTransient<JwtAuthorizationHandler>();

// Cliente de autenticación: NO lleva el handler de JWT porque el login es anónimo.
builder.Services.AddHttpClient<IAuthApiClient, AuthApiClient>(c => c.BaseAddress = new Uri(apiBaseUrl));

// Clientes de recurso: todos reenvían el JWT de la sesión actual.
builder.Services.AddHttpClient<IArticuloApiClient, ArticuloApiClient>(c => c.BaseAddress = new Uri(apiBaseUrl))
    .AddHttpMessageHandler<JwtAuthorizationHandler>();
builder.Services.AddHttpClient<IFabricanteArticuloApiClient, FabricanteArticuloApiClient>(c => c.BaseAddress = new Uri(apiBaseUrl))
    .AddHttpMessageHandler<JwtAuthorizationHandler>();
builder.Services.AddHttpClient<IGrupoArticuloApiClient, GrupoArticuloApiClient>(c => c.BaseAddress = new Uri(apiBaseUrl))
    .AddHttpMessageHandler<JwtAuthorizationHandler>();
builder.Services.AddHttpClient<IGrupoUnidadMedidaArticuloApiClient, GrupoUnidadMedidaArticuloApiClient>(c => c.BaseAddress = new Uri(apiBaseUrl))
    .AddHttpMessageHandler<JwtAuthorizationHandler>();
builder.Services.AddHttpClient<IGrupoUnidadMedidaDetArticuloApiClient, GrupoUnidadMedidaDetArticuloApiClient>(c => c.BaseAddress = new Uri(apiBaseUrl))
    .AddHttpMessageHandler<JwtAuthorizationHandler>();
builder.Services.AddHttpClient<IUnidadMedidaArticuloApiClient, UnidadMedidaArticuloApiClient>(c => c.BaseAddress = new Uri(apiBaseUrl))
    .AddHttpMessageHandler<JwtAuthorizationHandler>();
builder.Services.AddHttpClient<IAlmacenApiClient, AlmacenApiClient>(c => c.BaseAddress = new Uri(apiBaseUrl))
    .AddHttpMessageHandler<JwtAuthorizationHandler>();
builder.Services.AddHttpClient<ISocioNegocioApiClient, SocioNegocioApiClient>(c => c.BaseAddress = new Uri(apiBaseUrl))
    .AddHttpMessageHandler<JwtAuthorizationHandler>();
builder.Services.AddHttpClient<IGrupoSnApiClient, GrupoSnApiClient>(c => c.BaseAddress = new Uri(apiBaseUrl))
    .AddHttpMessageHandler<JwtAuthorizationHandler>();
builder.Services.AddHttpClient<IListadoPrecioApiClient, ListadoPrecioApiClient>(c => c.BaseAddress = new Uri(apiBaseUrl))
    .AddHttpMessageHandler<JwtAuthorizationHandler>();
builder.Services.AddHttpClient<IDireccionSocioNegocioApiClient, DireccionSocioNegocioApiClient>(c => c.BaseAddress = new Uri(apiBaseUrl))
    .AddHttpMessageHandler<JwtAuthorizationHandler>();
builder.Services.AddHttpClient<INumeracionDocumentoApiClient, NumeracionDocumentoApiClient>(c => c.BaseAddress = new Uri(apiBaseUrl))
    .AddHttpMessageHandler<JwtAuthorizationHandler>();
builder.Services.AddHttpClient<INumeracionDocumentoDetApiClient, NumeracionDocumentoDetApiClient>(c => c.BaseAddress = new Uri(apiBaseUrl))
    .AddHttpMessageHandler<JwtAuthorizationHandler>();
builder.Services.AddHttpClient<ICotizacionApiClient, CotizacionApiClient>(c => c.BaseAddress = new Uri(apiBaseUrl))
    .AddHttpMessageHandler<JwtAuthorizationHandler>();
builder.Services.AddHttpClient<ICotizacionDetalleApiClient, CotizacionDetalleApiClient>(c => c.BaseAddress = new Uri(apiBaseUrl))
    .AddHttpMessageHandler<JwtAuthorizationHandler>();
builder.Services.AddHttpClient<IPedidoApiClient, PedidoApiClient>(c => c.BaseAddress = new Uri(apiBaseUrl))
    .AddHttpMessageHandler<JwtAuthorizationHandler>();
builder.Services.AddHttpClient<IPedidoDetalleApiClient, PedidoDetalleApiClient>(c => c.BaseAddress = new Uri(apiBaseUrl))
    .AddHttpMessageHandler<JwtAuthorizationHandler>();
builder.Services.AddHttpClient<IPedidoCompraApiClient, PedidoCompraApiClient>(c => c.BaseAddress = new Uri(apiBaseUrl))
    .AddHttpMessageHandler<JwtAuthorizationHandler>();
builder.Services.AddHttpClient<IPedidoCompraDetalleApiClient, PedidoCompraDetalleApiClient>(c => c.BaseAddress = new Uri(apiBaseUrl))
    .AddHttpMessageHandler<JwtAuthorizationHandler>();
builder.Services.AddHttpClient<IEntregaApiClient, EntregaApiClient>(c => c.BaseAddress = new Uri(apiBaseUrl))
    .AddHttpMessageHandler<JwtAuthorizationHandler>();
builder.Services.AddHttpClient<IEntregaDetalleApiClient, EntregaDetalleApiClient>(c => c.BaseAddress = new Uri(apiBaseUrl))
    .AddHttpMessageHandler<JwtAuthorizationHandler>();
builder.Services.AddHttpClient<IEntregaCompraApiClient, EntregaCompraApiClient>(c => c.BaseAddress = new Uri(apiBaseUrl))
    .AddHttpMessageHandler<JwtAuthorizationHandler>();
builder.Services.AddHttpClient<IEntregaCompraDetalleApiClient, EntregaCompraDetalleApiClient>(c => c.BaseAddress = new Uri(apiBaseUrl))
    .AddHttpMessageHandler<JwtAuthorizationHandler>();
builder.Services.AddHttpClient<IFacturaApiClient, FacturaApiClient>(c => c.BaseAddress = new Uri(apiBaseUrl))
    .AddHttpMessageHandler<JwtAuthorizationHandler>();
builder.Services.AddHttpClient<IFacturaDetalleApiClient, FacturaDetalleApiClient>(c => c.BaseAddress = new Uri(apiBaseUrl))
    .AddHttpMessageHandler<JwtAuthorizationHandler>();

// Solo lectura, usados como fuente de dropdowns (ej. País/Departamento/Municipio en Almacenes).
builder.Services.AddHttpClient<IPaisApiClient, PaisApiClient>(c => c.BaseAddress = new Uri(apiBaseUrl))
    .AddHttpMessageHandler<JwtAuthorizationHandler>();
builder.Services.AddHttpClient<IDepartamentoApiClient, DepartamentoApiClient>(c => c.BaseAddress = new Uri(apiBaseUrl))
    .AddHttpMessageHandler<JwtAuthorizationHandler>();
builder.Services.AddHttpClient<IMunicipioApiClient, MunicipioApiClient>(c => c.BaseAddress = new Uri(apiBaseUrl))
    .AddHttpMessageHandler<JwtAuthorizationHandler>();
builder.Services.AddHttpClient<IMonedaApiClient, MonedaApiClient>(c => c.BaseAddress = new Uri(apiBaseUrl))
    .AddHttpMessageHandler<JwtAuthorizationHandler>();
builder.Services.AddHttpClient<IImpuestoApiClient, ImpuestoApiClient>(c => c.BaseAddress = new Uri(apiBaseUrl))
    .AddHttpMessageHandler<JwtAuthorizationHandler>();

builder.Services.AddAuthentication(AuthConstants.EsquemaCookie)
    .AddCookie(AuthConstants.EsquemaCookie, options =>
    {
        options.LoginPath = "/Cuenta/Login";
        options.AccessDeniedPath = "/Cuenta/Login";
        options.ExpireTimeSpan = TimeSpan.FromMinutes(60);
        options.SlidingExpiration = true;
    });

builder.Services.AddAuthorization();

// Los formularios de los módulos se envían por fetch como JSON, así que el antiforgery token
// viaja en un header (leído del <meta> que emite _Layout.cshtml) en vez de un campo de formulario.
builder.Services.AddAntiforgery(options => options.HeaderName = "X-CSRF-TOKEN");

var app = builder.Build();

if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseStaticFiles();

app.UseRouting();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");

app.Run();
