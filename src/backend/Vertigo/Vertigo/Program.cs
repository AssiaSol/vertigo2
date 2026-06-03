
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Vertigo.Data;
using Vertigo.Models;
using Vertigo.Services;

// Accept DateTimes of any Kind (Local/Unspecified/UTC) with PostgreSQL's
// 'timestamp with time zone' columns. Without this, saving a DateTime.Now
// (Kind=Local) throws "only UTC is supported".
AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);

var builder = WebApplication.CreateBuilder(args);

// Hosts like Render assign a port at runtime via the PORT env var and expect the
// app to listen on it. Bind to it when present; otherwise keep the local default.
var port = Environment.GetEnvironmentVariable("PORT");
if (!string.IsNullOrEmpty(port))
    builder.WebHost.UseUrls($"http://0.0.0.0:{port}");

// ── Services ──────────────────────────────────────────────────────────────────
builder.Services.AddControllersWithViews();
builder.Services.AddControllers();
builder.Services.AddOpenApi();
builder.Services.AddHttpClient();

// PostgreSQL (Neon) — one shared cloud database so every machine sees the same
// accounts, deals and orders. Connection string comes from configuration.
builder.Services.AddDbContext<VertigoContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection"))
        // The legacy-timestamp switch shifts the model fingerprint slightly; the
        // schema is unchanged, so don't treat it as a pending migration.
        .ConfigureWarnings(w => w.Ignore(RelationalEventId.PendingModelChangesWarning)));

builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(options =>
    {
        options.LoginPath = "/Account/Login";
        options.ExpireTimeSpan = TimeSpan.FromDays(14);
        options.SlidingExpiration = true;

        // Frontend (Vercel) and API (Render) live on different domains, so the auth
        // cookie is sent cross-site. Browsers only allow that with SameSite=None AND
        // Secure. Render serves the API over HTTPS, so this works in production.
        if (!builder.Environment.IsDevelopment())
        {
            options.Cookie.SameSite = SameSiteMode.None;
            options.Cookie.SecurePolicy = CookieSecurePolicy.Always;
        }
    });

// Allowed browser origins. Localhost is always permitted for local dev; production
// origins (e.g. the Vercel URL) come from the FRONTEND_ORIGINS env var, comma-separated.
var frontendOrigins = (Environment.GetEnvironmentVariable("FRONTEND_ORIGINS") ?? "")
    .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
    .Select(o => new Uri(o).Host)
    .ToHashSet(StringComparer.OrdinalIgnoreCase);

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp",
        policy => policy
            .SetIsOriginAllowed(origin =>
            {
                if (string.IsNullOrEmpty(origin)) return false;
                var uri = new Uri(origin);
                return uri.Host == "localhost"
                    || uri.Host == "127.0.0.1"
                    || frontendOrigins.Contains(uri.Host);
            })
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials());
});

var app = builder.Build();

// ── Middleware pipeline ───────────────────────────────────────────────────────
// Behind Render's load balancer the app receives plain HTTP with the original
// scheme in X-Forwarded-Proto. Apply these headers first so HttpsRedirection,
// Secure cookies and auth all see the request as the HTTPS request it really was.
var forwardedOptions = new ForwardedHeadersOptions
{
    ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto
};
forwardedOptions.KnownNetworks.Clear();
forwardedOptions.KnownProxies.Clear();
app.UseForwardedHeaders(forwardedOptions);

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}
else
{
    app.UseExceptionHandler("/Home/Error");
    app.UseHsts();
    app.UseHttpsRedirection();
}

app.UseCors("AllowReactApp");
app.UseAuthentication();
app.UseAuthorization();

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}")
    .WithStaticAssets();

app.MapControllers();

// ── Create/upgrade the database, then seed dev data (idempotent) ──────────────
// Database.Migrate() builds the DB and all tables from the committed migrations,
// so a teammate only needs to run `dotnet run` — no manual EF commands or SQL.
using (var scope = app.Services.CreateScope())
{
    var ctx = scope.ServiceProvider.GetRequiredService<VertigoContext>();
    await ctx.Database.MigrateAsync();
    await SeedData.EnsureSeededAsync(ctx);
}

app.Run();
