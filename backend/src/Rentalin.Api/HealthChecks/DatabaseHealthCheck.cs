using Microsoft.Extensions.Diagnostics.HealthChecks;
using Rentalin.Infrastructure.Data;

namespace Rentalin.Api.HealthChecks;

public sealed class DatabaseHealthCheck : IHealthCheck
{
    private readonly RentalinDbContext _db;

    public DatabaseHealthCheck(RentalinDbContext db) => _db = db;

    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context, CancellationToken ct = default)
    {
        try
        {
            var canConnect = await _db.Database.CanConnectAsync(ct);
            return canConnect
                ? HealthCheckResult.Healthy("Database reachable")
                : HealthCheckResult.Unhealthy("Cannot connect to database");
        }
        catch (Exception ex)
        {
            return HealthCheckResult.Unhealthy("Database check failed", ex);
        }
    }
}
