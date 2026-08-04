using System.Text;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;
using Microsoft.IdentityModel.Tokens;
using Rentalin.Api.Auth;
using Rentalin.Api.Endpoints;
using Rentalin.Api.HealthChecks;
using Rentalin.Api.Middleware;
using Rentalin.Core.Interfaces;
using Rentalin.Damage.Api.Endpoints;
using Rentalin.Damage.Domain.Entities;
using Rentalin.Fleet.Domain.Entities;
using Rentalin.Maintenance.Api.Endpoints;
using Rentalin.Maintenance.Domain.Entities;
using Rentalin.Infrastructure.Extensions;
using Rentalin.Infrastructure.Services;
using Rentalin.Inspections.Domain.Entities;
using Rentalin.Reservations.Domain.Entities;
using Rentalin.Timeline.Domain.Entities;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

// ── Structured Logging (production only) ────────────────────
if (!builder.Environment.IsDevelopment())
{
    builder.Host.UseSerilog((ctx, lc) => lc.ReadFrom.Configuration(ctx.Configuration));
}

// ── Configuration ───────────────────────────────────────────
var connectionString = builder.Configuration.GetConnectionString("Default")
    ?? builder.Configuration["Database:ConnectionString"]
    ?? (builder.Environment.IsDevelopment() ? "Data Source=rentalin.db" : null)
    ?? throw new InvalidOperationException(
        "Database connection string is required. Set ConnectionStrings:Default or Database:ConnectionString.");

builder.Services.AddInfrastructure(connectionString);

// ── MediatR ─────────────────────────────────────────────────
builder.Services.AddMediatR(cfg => cfg.RegisterServicesFromAssemblyContaining<Vehicle>());
builder.Services.AddMediatR(cfg => cfg.RegisterServicesFromAssemblyContaining<Inquiry>());
builder.Services.AddMediatR(cfg => cfg.RegisterServicesFromAssemblyContaining<TimelineEntry>());
builder.Services.AddMediatR(cfg => cfg.RegisterServicesFromAssemblyContaining<DamageRecord>());
builder.Services.AddMediatR(cfg => cfg.RegisterServicesFromAssemblyContaining<MaintenanceRecord>());
builder.Services.AddMediatR(cfg => cfg.RegisterServicesFromAssemblyContaining<Inspection>());
builder.Services.AddOpenApi();

// ── CORS ────────────────────────────────────────────────────
var frontendOrigin = builder.Configuration["Cors:FrontendOrigin"]
    ?? Environment.GetEnvironmentVariable("FRONTEND_ORIGIN")
    ?? (builder.Environment.IsDevelopment() ? "http://localhost:3000" : null);

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        if (!string.IsNullOrEmpty(frontendOrigin))
        {
            policy.WithOrigins(frontendOrigin)
                .WithMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .WithHeaders("Authorization", "Content-Type", "X-Requested-With", "X-CSRF-Token")
                .WithExposedHeaders("X-RateLimit-Limit", "X-RateLimit-Remaining", "X-RateLimit-Reset")
                .SetPreflightMaxAge(TimeSpan.FromMinutes(10));
        }
        else
        {
            // Fallback for environments where origin isn't configured yet
            policy.AllowAnyOrigin().WithMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .WithHeaders("Authorization", "Content-Type", "X-Requested-With", "X-CSRF-Token");
        }
    });
});

// ── Authentication ──────────────────────────────────────────
var jwtSecret = builder.Configuration["Jwt:Secret"]
    ?? Environment.GetEnvironmentVariable("JWT_SECRET")
    ?? (builder.Environment.IsDevelopment() ? "rentalin-dev-secret-key-change-in-production-32chars!" : null);

if (string.IsNullOrEmpty(jwtSecret))
    throw new InvalidOperationException(
        "JWT secret is required for production. Set Jwt:Secret or JWT_SECRET environment variable.");

builder.Services.AddSingleton(new JwtService(jwtSecret, "Rentalin"));

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = "Rentalin",
        ValidAudience = "Rentalin",
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
        ClockSkew = TimeSpan.FromMinutes(5)
    };
});

// ── Authorization ───────────────────────────────────────────
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("OwnerOnly", p => p.RequireClaim("role", "Owner"));
    options.AddPolicy("AdminOrOwner", p => p.RequireClaim("role", "Owner", "Admin"));
});

// ── Rate Limiting ───────────────────────────────────────────
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

    options.AddFixedWindowLimiter("GlobalPolicy", config =>
    {
        config.PermitLimit = 100;
        config.Window = TimeSpan.FromMinutes(1);
        config.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        config.QueueLimit = 0;
    });

    options.AddFixedWindowLimiter("AuthPolicy", config =>
    {
        config.PermitLimit = 10;
        config.Window = TimeSpan.FromMinutes(1);
        config.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        config.QueueLimit = 0;
    });

    options.AddFixedWindowLimiter("UploadPolicy", config =>
    {
        config.PermitLimit = 20;
        config.Window = TimeSpan.FromMinutes(1);
    });
});

// ── Health Checks ───────────────────────────────────────────
builder.Services.AddHealthChecks()
    .AddCheck<DatabaseHealthCheck>("database", tags: ["db"]);

// ── Services ────────────────────────────────────────────────
builder.Services.AddSingleton<INotificationService, LogNotificationService>();

// ── Kestrel ─────────────────────────────────────────────────
builder.WebHost.ConfigureKestrel(options =>
{
    options.Limits.MaxRequestBodySize = 10 * 1024 * 1024; // 10MB
});

var app = builder.Build();

// ── Pipeline ────────────────────────────────────────────────
app.UseMiddleware<SecurityHeadersMiddleware>();
app.UseMiddleware<DomainExceptionMiddleware>();

app.UseCors();

if (!app.Environment.IsDevelopment())
{
    app.UseSerilogRequestLogging();
    app.UseHttpsRedirection();
    app.UseHsts();
}

app.UseAuthentication();
app.UseAuthorization();
app.UseRateLimiter();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

// ── Health Check Endpoints ──────────────────────────────────
app.MapHealthChecks("/health", new HealthCheckOptions
{
    Predicate = _ => false, // Liveness: always returns 200 if app is running
    ResponseWriter = HealthCheckResponseWriter.WriteJson
});

app.MapHealthChecks("/health/ready", new HealthCheckOptions
{
    Predicate = r => r.Tags.Contains("db"),
    ResponseWriter = HealthCheckResponseWriter.WriteJson
});

// ── Apply Migrations & Seed ─────────────────────────────────
if (app.Environment.IsDevelopment())
{
    app.Services.ApplyMigrationsAndSeed();
}
else
{
    // In production, only apply migrations (no test seed data)
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<Rentalin.Infrastructure.Data.RentalinDbContext>();
    db.Database.Migrate();
}

// ── Auth Endpoints (unauthenticated, rate-limited) ──────────
app.MapAuthEndpoints();

// ── Public Endpoints (unauthenticated, global rate limit) ───
app.MapPublicEndpoints();
app.MapCustomerPortalEndpoints();

// ── Protected Endpoints ─────────────────────────────────────
app.MapBusinessEndpoints();
app.MapFleetEndpoints();
app.MapReservationEndpoints();
app.MapTimelineEndpoints();
app.MapInspectionEndpoints();
app.MapCustomerEndpoints();
app.MapPaymentEndpoints();
app.MapStaffEndpoints();
app.MapUploadEndpoints();
app.MapOperationsEndpoints();
app.MapSearchEndpoints();
app.MapDamageEndpoints();
app.MapMaintenanceEndpoints();

// ── Static Files ────────────────────────────────────────────
var uploadsPath = Path.Combine(app.Environment.ContentRootPath, "uploads");
Directory.CreateDirectory(uploadsPath);
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(uploadsPath),
    RequestPath = "/uploads"
});

app.Run();
