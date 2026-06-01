
using Microsoft.AspNetCore.Authentication.Cookies;
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

// ── Services ──────────────────────────────────────────────────────────────────
builder.Services.AddControllersWithViews();
builder.Services.AddControllers();
builder.Services.AddOpenApi();

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
    });

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp",
        policy => policy
            .SetIsOriginAllowed(origin =>
            {
                if (string.IsNullOrEmpty(origin)) return false;
                var uri = new Uri(origin);
                return uri.Host == "localhost" || uri.Host == "127.0.0.1";
            })
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials());
});

var app = builder.Build();

// ── Middleware pipeline ───────────────────────────────────────────────────────
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
