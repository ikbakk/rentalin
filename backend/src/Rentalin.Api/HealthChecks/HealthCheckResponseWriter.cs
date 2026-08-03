using System.Text.Json;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace Rentalin.Api.HealthChecks;

public static class HealthCheckResponseWriter
{
    public static Task WriteJson(HttpContext context, HealthReport report)
    {
        context.Response.ContentType = "application/json";

        var response = new
        {
            status = report.Status.ToString(),
            duration = report.TotalDuration.TotalMilliseconds,
            checks = report.Entries.Select(e => new
            {
                name = e.Key,
                status = e.Value.Status.ToString(),
                description = e.Value.Description,
                duration = e.Value.Duration.TotalMilliseconds,
                error = e.Value.Exception?.Message
            })
        };

        return context.Response.WriteAsync(JsonSerializer.Serialize(response));
    }
}
