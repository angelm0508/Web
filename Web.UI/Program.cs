using Microsoft.AspNetCore.Authentication.Cookies;
using Web.ApiClient.Autenticacion;
using Web.ApiClient.Clientes;
using Web.ApiClient.Configuracion;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllersWithViews();

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
builder.Services.AddHttpClient<IGrupoMedidaArticuloApiClient, GrupoMedidaArticuloApiClient>(c => c.BaseAddress = new Uri(apiBaseUrl))
    .AddHttpMessageHandler<JwtAuthorizationHandler>();
builder.Services.AddHttpClient<IMedidaArticuloApiClient, MedidaArticuloApiClient>(c => c.BaseAddress = new Uri(apiBaseUrl))
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
