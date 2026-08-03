using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.DependencyInjection;
using Rentalin.Infrastructure.Data;

namespace Rentalin.Integration.Tests;

public sealed class TestWebApplicationFactory : WebApplicationFactory<Program>
{
    private readonly SqliteConnection _connection;

    public TestWebApplicationFactory()
    {
        _connection = new SqliteConnection("Data Source=:memory:");
        _connection.Open();
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureServices(services =>
        {
            var descriptor = services.SingleOrDefault(d => d.ServiceType == typeof(DbContextOptions<RentalinDbContext>));
            if (descriptor is not null) services.Remove(descriptor);

            services.AddDbContext<RentalinDbContext>(options =>
            {
                options.UseSqlite(_connection);
                options.ConfigureWarnings(w => w.Ignore(RelationalEventId.PendingModelChangesWarning));
            });

            var sp = services.BuildServiceProvider();
            using var scope = sp.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<RentalinDbContext>();
            db.Database.EnsureCreated();

            db.Database.ExecuteSqlRaw(
                "CREATE TABLE IF NOT EXISTS __EFMigrationsHistory (MigrationId TEXT NOT NULL PRIMARY KEY, ProductVersion TEXT NOT NULL)");

            var pendingMigrations = db.Database.GetPendingMigrations().ToList();
            foreach (var migration in pendingMigrations)
            {
                db.Database.ExecuteSqlRaw(
                    "INSERT INTO __EFMigrationsHistory (MigrationId, ProductVersion) VALUES ({0}, '10.0.0')",
                    migration);
            }
        });
    }

    protected override void Dispose(bool disposing)
    {
        _connection.Dispose();
        base.Dispose(disposing);
    }
}
