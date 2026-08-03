# Rentalin Monitoring & Observability Guide

## 1. Monitoring Philosophy

### Context

Rentalin is a business-critical vehicle rental operations tool serving small Indonesian rental businesses. Downtime means lost revenue — a single missed booking can cost Rp 350,000–800,000 per vehicle day. Users often operate on unreliable internet connections, making offline resilience and client-side observability just as important as server-side monitoring.

### Golden Signals

Every observable system should answer four questions. For Rentalin, we measure:

| Signal | Definition | Rentalin-Specific Metrics |
|---|---|---|
| **Latency** | Time to service a request | API response time (p50, p95, p99) per endpoint; MediatR handler duration; EF Core query time |
| **Traffic** | Demand on the system | HTTP requests/sec; active rentals count; pending inquiry volume |
| **Errors** | Rate of failed requests | HTTP 5xx rate; domain exception count; failed payment count; MediatR handler failures |
| **Saturation** | How "full" the service is | DB connection pool utilization; GC heap size; thread pool busy threads; disk usage % |

### Observability Stack

```
Application Layer
  ├── .NET 10 Backend (Minimal APIs + MediatR)
  │     ├── OpenTelemetry SDK (.NET ActivitySource + Meters)
  │     ├── Serilog (structured JSON) → stdout/files
  │     └── ASP.NET Core Health Checks
  │
  ├── Next.js 16 Frontend
  │     ├── window.onerror + custom error boundary
  │     ├── PerformanceObserver (Core Web Vitals)
  │     └── Custom fetch wrapper metrics
  │
Collection Layer
  ├── OpenTelemetry Collector (agent on host or sidecar)
  │     ├── Receivers: OTLP (gRPC), Prometheus scrape, filelog
  │     └── Exporters: Loki, Tempo, Prometheus remote write
  │
Storage & Visualization
  ├── Grafana (dashboards + alerting)
  ├── Loki (log aggregation)
  ├── Tempo (distributed tracing)
  └── Prometheus (metrics TSDB)
```

For simple single-VPS deployments, swap the OTel Collector/Loki/Tempo stack for **Seq** (structured log server) plus **Prometheus + Grafana** — installable via a single `docker-compose.yml`.

---

## 2. Logging Strategy

### 2.1 Structured Logging (Backend)

Replace the default `appsettings.json` logging with Serilog for structured JSON output. Every log entry must carry context.

**appsettings.json** additions:

```json
{
  "Serilog": {
    "MinimumLevel": {
      "Default": "Information",
      "Override": {
        "Microsoft.AspNetCore": "Warning",
        "Microsoft.EntityFrameworkCore": "Warning",
        "Rentalin": "Debug"
      }
    },
    "WriteTo": [
      {
        "Name": "Console",
        "Args": {
          "formatter": "Serilog.Formatting.Compact.RenderedCompactJsonFormatter, Serilog.Formatting.Compact"
        }
      },
      {
        "Name": "File",
        "Args": {
          "path": "/var/log/rentalin/rentalin-.log",
          "rollingInterval": "Day",
          "retainedFileCountLimit": 30,
          "formatter": "Serilog.Formatting.Compact.RenderedCompactJsonFormatter, Serilog.Formatting.Compact"
        }
      }
    ],
    "Enrich": ["WithMachineName", "WithThreadId"],
    "Properties": {
      "Application": "Rentalin.Api",
      "Environment": "Production"
    }
  }
}
```

**Program.cs** — add Serilog + correlation ID middleware:

```csharp
using Serilog;

var builder = WebApplication.CreateBuilder(args);

builder.Host.UseSerilog((ctx, lc) => lc.ReadFrom.Configuration(ctx.Configuration));

builder.Services.AddInfrastructure("Data Source=rentalin.db"); // SQLite dev — use Npgsql in prod

// Correlation ID middleware
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<CorrelationContext>();

// ... existing MediatR, OpenApi, CORS registrations ...
```

**CorrelationContext.cs** (`Rentalin.Core`):

```csharp
namespace Rentalin.Core;

public sealed class CorrelationContext
{
    private readonly IHttpContextAccessor _httpContextAccessor;
    private string? _correlationId;

    public CorrelationContext(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public string CorrelationId
    {
        get
        {
            if (_correlationId is not null) return _correlationId;

            var ctx = _httpContextAccessor.HttpContext;
            if (ctx?.Request.Headers.TryGetValue("X-Correlation-Id", out var headerId) == true)
            {
                _correlationId = headerId.ToString();
            }
            else
            {
                _correlationId = Guid.NewGuid().ToString("N");
            }

            return _correlationId;
        }
    }
}
```

**CorrelationIdMiddleware.cs** — add to the ASP.NET pipeline:

```csharp
namespace Rentalin.Api.Middleware;

public sealed class CorrelationIdMiddleware
{
    private readonly RequestDelegate _next;

    public CorrelationIdMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var correlationId = context.Request.Headers["X-Correlation-Id"].FirstOrDefault()
                            ?? Guid.NewGuid().ToString("N");

        context.Response.Headers["X-Correlation-Id"] = correlationId;
        context.Items["CorrelationId"] = correlationId;

        using (LogContext.PushProperty("CorrelationId", correlationId))
        {
            await _next(context);
        }
    }
}
```

**Log envelope format** (every log line):

```json
{
  "@t": "2026-07-30T08:30:12.345Z",
  "@l": "Information",
  "@mt": "Inquiry {InquiryId} created for vehicle {VehicleId}",
  "InquiryId": "a1b2c3d4",
  "VehicleId": "e5f6a7b8",
  "CorrelationId": "3f8a9b2c1d4e5f6a",
  "UserId": "staff_01",
  "BusinessId": "biz_jakarta",
  "SourceContext": "Rentalin.Reservations.Handlers.CreateInquiryHandler",
  "Application": "Rentalin.Api",
  "Environment": "Production"
}
```

### 2.2 Log Levels

| Level | When to Use | Example |
|---|---|---|
| **Trace** | Debug-level details (never in prod) | SQL parameter values during EF query |
| **Debug** | Dev diagnostics | "Loaded 12 vehicles from cache" |
| **Information** | Business events, state transitions | "Rental completed for vehicle B 1234 ABC" |
| **Warning** | Recoverable errors, degradation | "Payment gateway timeout, retrying (attempt 2/3)" |
| **Error** | Failed operations needing attention | "Failed to save inspection record: duplicate key" |
| **Critical** | System-down events | "Database connection pool exhausted" |

### 2.3 Key Log Points

**Every API request/response:**

```csharp
// Middleware — logs before/after every request
app.Use(async (ctx, next) =>
{
    var logger = ctx.RequestServices.GetRequiredService<ILogger<Program>>();
    var sw = Stopwatch.StartNew();

    await next();

    logger.LogInformation(
        "HTTP {Method} {Path} responded {StatusCode} in {DurationMs}ms",
        ctx.Request.Method, ctx.Request.Path, ctx.Response.StatusCode, sw.ElapsedMilliseconds);
});
```

**Every domain event published** — Enhance `DomainEventDispatchingInterceptor`:

```csharp
// In DispatchDomainEventsAsync, add logging:
foreach (var domainEvent in domainEvents)
{
    _logger.LogInformation(
        "DomainEvent {EventType} dispatched for aggregate {AggregateType}",
        domainEvent.GetType().Name,
        agg.Entity.GetType().Name);
    await publisher.Publish(domainEvent, ct);
}
```

**Every payment transaction:**
- Log payment initiation (amount, method, rental ID)
- Log payment result (success/failure, gateway reference)
- Log payment reconciliation events

**Application startup/shutdown:**

```csharp
var lifetime = app.Services.GetRequiredService<IHostApplicationLifetime>();
lifetime.ApplicationStarted.Register(() =>
    Log.Information("Rentalin.Api started. Listening on {Urls}",
        string.Join(", ", app.Urls)));
lifetime.ApplicationStopping.Register(() =>
    Log.Information("Rentalin.Api shutting down..."));
```

### 2.4 PII Protection

Never log raw phone numbers, emails, or full names. Use masking:

```csharp
public static class PiiMasking
{
    public static string MaskPhone(string phone) =>
        string.IsNullOrEmpty(phone) || phone.Length < 5
            ? "***"
            : $"{phone[..3]}***{phone[^2..]}";

    public static string MaskEmail(string email) =>
        string.IsNullOrEmpty(email) || !email.Contains('@')
            ? "***@***"
            : $"{email[..2]}***@{email.Split('@')[1]}";
}
```

### 2.5 Frontend Logging

**`src/lib/telemetry.ts`** (Next.js frontend):

```typescript
const LOG_ENDPOINT = process.env.NEXT_PUBLIC_TELEMETRY_URL ?? "/api/telemetry/log";

function generateCorrelationId(): string {
  return crypto.randomUUID().replace(/-/g, "");
}

let correlationId = generateCorrelationId();
export function getCorrelationId(): string {
  return correlationId;
}

interface LogPayload {
  level: "info" | "warn" | "error";
  message: string;
  context?: Record<string, unknown>;
}

export function sendLog(payload: LogPayload): void {
  const body = {
    ...payload,
    timestamp: new Date().toISOString(),
    correlationId: getCorrelationId(),
    userAgent: navigator.userAgent,
    url: window.location.href,
  };

  // Fire-and-forget to avoid blocking — use sendBeacon for reliability
  const blob = new Blob([JSON.stringify(body)], { type: "application/json" });
  navigator.sendBeacon(LOG_ENDPOINT, blob);
}

// Capture unhandled errors
if (typeof window !== "undefined") {
  window.onerror = (message, source, lineno, colno, error) => {
    sendLog({
      level: "error",
      message: `Unhandled JS error: ${message}`,
      context: { source: `${source}:${lineno}:${colno}`, stack: error?.stack },
    });
  };

  window.onunhandledrejection = (event) => {
    sendLog({
      level: "error",
      message: `Unhandled promise rejection: ${event.reason}`,
    });
  };

  // Offline detection
  window.addEventListener("offline", () => {
    sendLog({ level: "warn", message: "Browser went offline" });
  });
  window.addEventListener("online", () => {
    sendLog({ level: "info", message: "Browser came back online" });
  });
}
```

**Enhanced API client** (`src/lib/api.ts`):

```typescript
import { getCorrelationId, sendLog } from "./telemetry";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const start = performance.now();
  const headers = {
    "Content-Type": "application/json",
    "X-Correlation-Id": getCorrelationId(),
    ...options?.headers,
  };

  try {
    const res = await fetch(`${BASE_URL}${path}`, { headers, ...options });
    const duration = performance.now() - start;

    if (!res.ok) {
      sendLog({
        level: "error",
        message: `API ${options?.method ?? "GET"} ${path} failed: ${res.status}`,
        context: { status: res.status, durationMs: Math.round(duration) },
      });
      throw new Error(`API error: ${res.status}`);
    }

    return res.json();
  } catch (err) {
    sendLog({
      level: "error",
      message: `API ${options?.method ?? "GET"} ${path} network error`,
      context: { error: (err as Error).message },
    });
    throw err;
  }
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "PUT", body: JSON.stringify(body) }),
};
```

### 2.6 Log Aggregation

**Option A: Lightweight (Seq on single VPS)**
```
Docker: docker run -d -p 5341:80 -e ACCEPT_EULA=Y datalust/seq
Configure Serilog sink: Serilog.Sinks.Seq
Seq provides built-in search, dashboards, and alerting.
```

**Option B: Full stack (Loki + Grafana)**
```
Docker Compose: containers for Loki, Promtail, Grafana
Promtail scrapes JSON log files from /var/log/rentalin/*.log
Grafana queries Loki with LogQL.
```

---

## 3. Metrics Strategy

### 3.1 Infrastructure Metrics

Collect these with `System.Diagnostics.Metrics` (built into .NET) + Prometheus exporter:

```csharp
// Program.cs
builder.Services.AddOpenTelemetry()
    .WithMetrics(m => m
        .AddAspNetCoreInstrumentation()
        .AddHttpClientInstrumentation()
        .AddRuntimeInstrumentation()  // GC, thread pool, memory
        .AddPrometheusExporter());
```

Key infrastructure metrics exposed at `/metrics`:

| Metric | Type | Description |
|---|---|---|
| `process_cpu_seconds_total` | Counter | Total CPU time used |
| `process_working_set_bytes` | Gauge | Working set memory |
| `dotnet_gc_collection_seconds` | Histogram | GC pause time per generation |
| `dotnet_gc_heap_size_bytes` | Gauge | GC heap sizes (gen0/1/2/LOH) |
| `dotnet_thread_pool_queue_length` | Gauge | Thread pool pending work items |
| `kestrel_connections_total` | Counter | Total connections handled |
| `kestrel_active_connections` | Gauge | Currently open connections |
| `system_disk_usage_percent` | Gauge | Disk utilization (via node_exporter) |

### 3.2 Application Metrics

**Custom Meter definition** (`Rentalin.Core/Diagnostics/ApplicationMetrics.cs`):

```csharp
using System.Diagnostics.Metrics;

namespace Rentalin.Core.Diagnostics;

public static class ApplicationMetrics
{
    public static readonly Meter Meter = new("Rentalin", "1.0.0");

    // API metrics
    public static readonly Histogram<double> ApiRequestDuration = Meter.CreateHistogram<double>(
        "rentalin_api_request_duration_seconds",
        "s",
        "API request duration in seconds");

    // Handler metrics
    public static readonly Histogram<double> HandlerDuration = Meter.CreateHistogram<double>(
        "rentalin_handler_duration_seconds",
        "s",
        "MediatR handler execution duration");

    // Domain event metrics
    public static readonly Histogram<double> DomainEventProcessingDuration = Meter.CreateHistogram<double>(
        "rentalin_domain_event_processing_duration_seconds",
        "s",
        "Domain event processing time");

    // EF Core query metrics
    public static readonly Histogram<double> EfQueryDuration = Meter.CreateHistogram<double>(
        "rentalin_ef_query_duration_seconds",
        "s",
        "EF Core query execution duration");

    // Business metrics
    public static readonly ObservableGauge<int> ActiveRentals = Meter.CreateObservableGauge(
        "rentalin_active_rentals", () => BusinessMetricsSnapshot.ActiveRentals, description: "Count of currently active rentals");

    public static readonly ObservableGauge<int> AvailableVehicles = Meter.CreateObservableGauge(
        "rentalin_available_vehicles", () => BusinessMetricsSnapshot.AvailableVehicles, description: "Count of available vehicles");

    public static readonly ObservableGauge<int> PendingInspections = Meter.CreateObservableGauge(
        "rentalin_pending_inspections", () => BusinessMetricsSnapshot.PendingInspections, description: "Count of pending inspections");

    public static readonly Counter<long> PaymentsProcessed = Meter.CreateCounter<long>(
        "rentalin_payments_processed_total", description: "Total payments processed");

    // Security
    public static readonly Counter<long> FailedLogins = Meter.CreateCounter<long>(
        "rentalin_failed_logins_total", description: "Total failed login attempts");
}

public static class BusinessMetricsSnapshot
{
    public static int ActiveRentals { get; set; }
    public static int AvailableVehicles { get; set; }
    public static int PendingInspections { get; set; }
}
```

**Background service to refresh business metrics** (`Rentalin.Api/Services/BusinessMetricsCollector.cs`):

```csharp
namespace Rentalin.Api.Services;

public sealed class BusinessMetricsCollector : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<BusinessMetricsCollector> _logger;

    public BusinessMetricsCollector(IServiceProvider sp, ILogger<BusinessMetricsCollector> logger)
    {
        _serviceProvider = sp;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken ct)
    {
        while (!ct.IsCancellationRequested)
        {
            try
            {
                using var scope = _serviceProvider.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<RentalinDbContext>();

                BusinessMetricsSnapshot.ActiveRentals =
                    await db.Rentals.CountAsync(r => r.Status == RentalStatus.Active, ct);
                BusinessMetricsSnapshot.AvailableVehicles =
                    await db.Vehicles.CountAsync(v => v.Status == VehicleStatus.Available, ct);
                BusinessMetricsSnapshot.PendingInspections =
                    await db.Inspections.CountAsync(i => i.Status == InspectionStatus.Pending, ct);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to collect business metrics");
            }

            await Task.Delay(TimeSpan.FromSeconds(30), ct);
        }
    }
}
```

**MediatR Pipeline Behavior for handler metrics:**

```csharp
// Rentalin.Api/Behaviors/MetricsPipelineBehavior.cs
using System.Diagnostics;
using System.Diagnostics.Metrics;
using MediatR;
using Rentalin.Core.Diagnostics;

namespace Rentalin.Api.Behaviors;

public sealed class MetricsPipelineBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
    where TRequest : notnull
{
    public async Task<TResponse> Handle(
        TRequest request,
        RequestHandlerDelegate<TResponse> next,
        CancellationToken ct)
    {
        var tag = new TagList { { "handler", typeof(TRequest).Name } };
        var sw = Stopwatch.StartNew();

        try
        {
            var response = await next();
            sw.Stop();

            ApplicationMetrics.HandlerDuration.Record(sw.Elapsed.TotalSeconds, tag);
            return response;
        }
        catch (Exception)
        {
            sw.Stop();
            ApplicationMetrics.HandlerDuration.Record(sw.Elapsed.TotalSeconds, tag);
            throw;
        }
    }
}

// Register in Program.cs:
builder.Services.AddTransient(typeof(IPipelineBehavior<,>), typeof(MetricsPipelineBehavior<,>));
```

**EF Core performance interceptor** (`Rentalin.Infrastructure/Data/Interceptors/QueryMetricsInterceptor.cs`):

```csharp
using System.Data.Common;
using System.Diagnostics;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.Logging;
using Rentalin.Core.Diagnostics;

namespace Rentalin.Infrastructure.Data.Interceptors;

public sealed class QueryMetricsInterceptor : DbCommandInterceptor
{
    private readonly ILogger<QueryMetricsInterceptor> _logger;

    public QueryMetricsInterceptor(ILogger<QueryMetricsInterceptor> logger)
    {
        _logger = logger;
    }

    public override async ValueTask<DbDataReader> ReaderExecutedAsync(
        DbCommand command,
        CommandExecutedEventData eventData,
        DbDataReader result,
        CancellationToken ct = default)
    {
        var duration = eventData.Duration.TotalSeconds;
        var tag = new TagList { { "query", command.CommandText[..Math.Min(200, command.CommandText.Length)] } };
        ApplicationMetrics.EfQueryDuration.Record(duration, tag);

        if (eventData.Duration.TotalMilliseconds > 200)
        {
            _logger.LogWarning(
                "Slow EF query ({DurationMs}ms): {Query}",
                eventData.Duration.TotalMilliseconds,
                command.CommandText);
        }

        return result;
    }
}
```

### 3.3 Service Level Objectives (SLOs)

| SLO | Target | Measurement Window | Rationale |
|---|---|---|---|
| **API Availability** | 99.5% | Monthly | Acceptable for VPS-based SaaS; one VPS reboot per month is ~6 hours budget |
| **API p95 Latency** | < 500ms | Rolling 30d | Keeps UI interactive for users on Indonesian mobile internet |
| **Error Rate** | < 1% of requests | Rolling 30d | Domain errors (validation, not-found) are NOT errors for this metric — only 5xx and unhandled exceptions |
| **Database Query p95** | < 100ms | Rolling 7d | SQLite on-device should be fast; PostgreSQL over network may be slower |
| **Payment Processing Success** | > 99.9% | Rolling 30d | Failed payments = lost revenue; critical business metric |
| **Backup Integrity** | 100% verified | Weekly | Automate restore-and-verify into a staging DB |

**Error budget burn rate alerts:**
- 2% burn rate in 1 hour → P2 alert
- 10% burn rate in 1 hour → P1 alert

---

## 4. Tracing Strategy

### 4.1 Distributed Tracing

Every API request receives a `correlation_id` that propagates through:
1. Frontend `X-Correlation-Id` header → Backend HTTP middleware
2. Backend middleware → MediatR handlers (via `CorrelationContext`)
3. MediatR handlers → EF Core commands (via `SetTag`)
4. EF Core → Database (as application_name or comment)

**OpenTelemetry setup in Program.cs:**

```csharp
using OpenTelemetry.Resources;
using OpenTelemetry.Trace;

builder.Services.AddOpenTelemetry()
    .ConfigureResource(r => r.AddService(
        serviceName: "rentalin-api",
        serviceVersion: "1.0.0"))
    .WithTracing(t => t
        .AddAspNetCoreInstrumentation()
        .AddHttpClientInstrumentation()
        .AddEntityFrameworkCoreInstrumentation()
        .AddSource("Rentalin") // Our custom ActivitySource
        .SetSampler(new ParentBasedSampler(new TraceIdRatioBasedSampler(0.1)))
        .SetErrorStatusOnException()
        .AddOtlpExporter(o =>
        {
            o.Endpoint = new Uri("http://localhost:4317");
            o.Protocol = OpenTelemetry.Exporter.OtlpExportProtocol.Grpc;
        }));
```

**Sampling strategy:**
- Sample 100% of requests that end in error (via `SetErrorStatusOnException`)
- Sample 10% of successful requests
- Adjust the 10% ratio down for high-traffic periods

**Custom ActivitySource** (used in MediatR handlers):

```csharp
// Rentalin.Core/Diagnostics/Telemetry.cs
using System.Diagnostics;

namespace Rentalin.Core.Diagnostics;

public static class Telemetry
{
    public static readonly ActivitySource Source = new("Rentalin");
}
```

**Tracing in a handler example:**

```csharp
using Rentalin.Core.Diagnostics;

public async Task<InquiryResponse> Handle(CreateInquiryRequest request, CancellationToken ct)
{
    using var activity = Telemetry.Source.StartActivity("CreateInquiry");

    activity?.SetTag("rentalin.customer_id", request.CustomerId);
    activity?.SetTag("rentalin.vehicle_id", request.VehicleId);

    // ... business logic ...

    return response;
}
```

### 4.2 Span Structure for a Typical Rental Flow

```
HTTP POST /api/inquiries                      [500ms]
├── MediatR: CreateInquiryHandler              [150ms]
│   ├── EF Core: INSERT INTO Inquiries         [45ms]
│   ├── DomainEvent: InquiryCreated            [20ms]
│   └── Validation                             [5ms]
└── MediatR: TimelineEntryCreatedHandler       [80ms]
    ├── EF Core: INSERT INTO TimelineEntries   [30ms]
    └── DomainEvent: TimelineUpdated           [10ms]
```

---

## 5. Alerting Strategy

### 5.1 Alert Definitions

#### P1 — Critical (Immediate response — page on-call via SMS/Pushover)

| Alert | Condition | Duration | Recovery |
|---|---|---|---|
| **API Error Rate Spike** | `rate(http_5xx_total[5m]) / rate(http_requests_total[5m]) > 0.05` | 5 min | Auto-resolve when < 0.01 for 10 min |
| **Database Connection Failure** | `ef_core_connection_failures > 0` | Instant | Resolve on next successful health check |
| **Disk Usage Critical** | `disk_used_percent > 90` | 5 min | Resolve when < 85% |
| **Memory Exhaustion** | `process_working_set_bytes / system_memory_bytes > 0.95` | 5 min | Resolve when < 0.80 |
| **Payment Failure Spike** | `rate(rentalin_payment_failures_total[10m]) > 5` | 5 min | Resolve when back to baseline |
| **Certificate Expiring** | `ssl_cert_days_remaining < 7` | Instant | Resolve on renewal |

**Prometheus alert rule example:**

```yaml
groups:
  - name: rentalin_p1
    rules:
      - alert: HighErrorRate
        expr: |
          sum(rate(http_server_request_duration_seconds_count{status=~"5.."}[5m]))
          / sum(rate(http_server_request_duration_seconds_count[5m])) > 0.05
        for: 5m
        labels:
          severity: critical
          priority: p1
        annotations:
          summary: "API error rate is {{ $value | humanizePercentage }}"
          description: "5xx rate exceeded 5% threshold for 5 minutes."

      - alert: DatabaseDown
        expr: healthcheck_status{name="database"} == 0
        for: 1m
        labels:
          severity: critical
          priority: p1
        annotations:
          summary: "Database health check failing"
          description: "Rentalin cannot connect to the database."

      - alert: DiskFull
        expr: 100 - (node_filesystem_avail_bytes{mountpoint="/"} / node_filesystem_size_bytes{mountpoint="/"} * 100) > 90
        for: 5m
        labels:
          severity: critical
          priority: p1

      - alert: PaymentFailureSpike
        expr: rate(rentalin_payments_processed_total{status="failed"}[10m]) > 5
        for: 5m
        labels:
          severity: critical
          priority: p1
```

#### P2 — Warning (Respond within 1 hour — push notification)

| Alert | Condition |
|---|---|
| **API Latency Spike** | `histogram_quantile(0.95, rate(http_server_request_duration_seconds_bucket[5m])) > 2` |
| **All Vehicles Idle** | `rentalin_active_rentals == 0 AND rentalin_available_vehicles == rentalin_total_vehicles` (possible system issue, not normal for a rental business during operating hours) |
| **Backup Failure** | `backup_success == 0` after scheduled run |
| **Certificate Expiring (warning)** | `ssl_cert_days_remaining < 30` |
| **Brute Force Attempt** | `rate(rentalin_failed_logins_total[5m]) > 10` |

#### P3 — Info (Respond within 24 hours — email digest)

| Alert | Condition |
|---|---|
| **Disk Usage Warning** | `disk_used_percent > 70` |
| **Slow Query Detected** | `ef_query_duration_seconds > 0.5` (any occurrence) |
| **Deprecated Endpoint Usage** | Custom counter on routes flagged as deprecated |
| **4xx Rate Increase** | `rate(http_4xx_total[1h])` above rolling 7-day average by 3x |

### 5.2 Alert Fatigue Prevention

1. **Grouping**: Group alerts by `alertname` + `severity` within 5-minute windows
2. **Auto-resolve**: Each alert has a `for` clause for trigger and auto-resolves when condition clears for 10 minutes
3. **Silence windows**: Planned maintenance silences all alerts via Grafana Silence or Alertmanager
4. **Escalation chain**: P1 (5 min, no ack → escalate) → P1 (10 min, no ack → SMS to business owner)
5. **Rate limiting**: Maximum 1 notification per alert group per 30 minutes

### 5.3 Notification Channels

| Channel | P1 | P2 | P3 |
|---|---|---|---|
| **Pushover/SMS** | Yes | — | — |
| **Mobile push** | Yes | Yes | — |
| **Email** | Yes | Yes | Yes (daily digest) |
| **Slack/Discord** | Yes | Yes | — |

---

## 6. Health Checks

### 6.1 Endpoints

| Endpoint | Purpose | Response Time Target |
|---|---|---|
| `GET /health` | Liveness — is the process running? | < 50ms |
| `GET /health/ready` | Readiness — can we serve traffic? | < 200ms |
| `GET /health/deep` | Full check — all dependencies | < 2s |

### 6.2 Implementation

**Program.cs:**

```csharp
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Rentalin.Infrastructure.Data;

builder.Services.AddHealthChecks()
    .AddDbContextCheck<RentalinDbContext>("database", failureStatus: HealthStatus.Unhealthy, tags: ["db"])
    .AddCheck<DiskSpaceHealthCheck>("disk_space", failureStatus: HealthStatus.Degraded, tags: ["infra"])
    .AddCheck<MigrationHealthCheck>("migrations", failureStatus: HealthStatus.Unhealthy, tags: ["db"])
    .AddCheck("self", () => HealthCheckResult.Healthy("Rentalin is alive"));

// Map health check endpoints
app.MapHealthChecks("/health", new HealthCheckOptions
{
    Predicate = _ => false, // Only liveness (the "self" check always passes if app is running)
    ResponseWriter = HealthCheckWriters.WriteSimpleJson
});

app.MapHealthChecks("/health/ready", new HealthCheckOptions
{
    Predicate = r => r.Tags.Contains("db"),
    ResponseWriter = HealthCheckWriters.WriteSimpleJson
});

app.MapHealthChecks("/health/deep", new HealthCheckOptions
{
    Predicate = _ => true,
    ResponseWriter = HealthCheckWriters.WriteDetailedJson
});
```

**DiskSpaceHealthCheck.cs** (warn when disk is getting full):

```csharp
namespace Rentalin.Api.HealthChecks;

public sealed class DiskSpaceHealthCheck : IHealthCheck
{
    private const long MinFreeMegabytes = 1024; // 1 GB

    public Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context, CancellationToken ct = default)
    {
        var drive = new DriveInfo(Path.GetPathRoot(Environment.CurrentDirectory) ?? "/");
        var freeMb = drive.AvailableFreeSpace / (1024 * 1024);

        if (freeMb < 500)
            return Task.FromResult(HealthCheckResult.Unhealthy($"Disk space critical: {freeMb} MB free"));

        if (freeMb < MinFreeMegabytes)
            return Task.FromResult(HealthCheckResult.Degraded($"Disk space low: {freeMb} MB free"));

        return Task.FromResult(HealthCheckResult.Healthy($"Disk OK: {freeMb} MB free"));
    }
}
```

**MigrationHealthCheck.cs** — ensures all pending EF Core migrations have been applied:

```csharp
namespace Rentalin.Api.HealthChecks;

public sealed class MigrationHealthCheck : IHealthCheck
{
    private readonly RentalinDbContext _db;

    public MigrationHealthCheck(RentalinDbContext db) => _db = db;

    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context, CancellationToken ct)
    {
        try
        {
            var pending = await _db.Database.GetPendingMigrationsAsync(ct);
            return pending.Any()
                ? HealthCheckResult.Unhealthy($"{pending.Count()} pending migrations")
                : HealthCheckResult.Healthy("Migrations up to date");
        }
        catch (Exception ex)
        {
            return HealthCheckResult.Unhealthy("Failed to check migrations", ex);
        }
    }
}
```

### 6.3 External Health Check

Use a free external monitoring service (UptimeRobot, BetterStack, or a self-hosted Uptime Kuma) to hit `/health/ready` every 60 seconds from a different geographic region than the server. This catches:
- Network-level failures (firewall, DNS)
- Process crashes (systemd didn't restart fast enough)
- Resource exhaustion that internal checks miss

---

## 7. Frontend Monitoring

### 7.1 Core Web Vitals (Real User Monitoring)

**`src/lib/vitals.ts`:**

```typescript
import { sendLog, getCorrelationId } from "./telemetry";

const VITALS_ENDPOINT = "/api/telemetry/vitals";

interface VitalMetric {
  name: string;
  value: number;
  rating: "good" | "needs-improvement" | "poor";
}

function getRating(name: string, value: number): VitalMetric["rating"] {
  switch (name) {
    case "LCP":
      return value <= 2500 ? "good" : value <= 4000 ? "needs-improvement" : "poor";
    case "INP": // Interaction to Next Paint (replaces FID)
      return value <= 200 ? "good" : value <= 500 ? "needs-improvement" : "poor";
    case "CLS":
      return value <= 0.1 ? "good" : value <= 0.25 ? "needs-improvement" : "poor";
    default:
      return "good";
  }
}

function reportVital(metric: VitalMetric): void {
  navigator.sendBeacon(
    VITALS_ENDPOINT,
    new Blob([JSON.stringify({
      ...metric,
      url: window.location.pathname,
      correlationId: getCorrelationId(),
      timestamp: Date.now(),
    })], { type: "application/json" })
  );
}

export function initVitals(): void {
  if (typeof window === "undefined" || typeof PerformanceObserver === "undefined") return;

  // LCP
  try {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const lcp = entry as LargestContentfulPaintEntry;
        reportVital({ name: "LCP", value: lcp.startTime, rating: getRating("LCP", lcp.startTime) });
      }
    }).observe({ type: "largest-contentful-paint", buffered: true });
  } catch {}

  // INP (Interaction to Next Paint) — Chrome only
  try {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const inp = entry as PerformanceEventTiming;
        reportVital({ name: "INP", value: inp.duration, rating: getRating("INP", inp.duration) });
      }
    }).observe({ type: "event", buffered: true, durationThreshold: 16 });
  } catch {}

  // CLS
  try {
    let clsValue = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const layoutShift = entry as LayoutShift;
        if (!layoutShift.hadRecentInput) clsValue += layoutShift.value;
      }
      reportVital({ name: "CLS", value: clsValue, rating: getRating("CLS", clsValue) });
    }).observe({ type: "layout-shift", buffered: true });
  } catch {}
}
```

Call `initVitals()` in the root layout or providers.

### 7.2 API Call Success/Failure Dashboard Metrics

From the enhanced `api.ts`, push metrics to the local `/api/telemetry/log` endpoint. Backend aggregates:
- API success rate by frontend route
- API latency from client perspective (includes network time)
- Top failing endpoints

### 7.3 Synthetic Monitoring

A lightweight script run from a cron job (or GitHub Actions scheduled workflow):

```bash
#!/bin/bash
# synthetic-check.sh — run every 5 minutes from an external server

BASE_URL="${RENTALIN_URL:-https://rentalin.example.com}"
FAILURES=0

check_endpoint() {
  local path=$1
  local expected=$2
  local status=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "${BASE_URL}${path}")
  if [ "$status" != "$expected" ]; then
    echo "FAIL: ${path} returned ${status}, expected ${expected}"
    FAILURES=$((FAILURES + 1))
  fi
}

check_endpoint "/health/ready" "200"
check_endpoint "/api/vehicles/" "200"
check_endpoint "/api/inquiries/" "200"

if [ $FAILURES -gt 0 ]; then
  # Send alert to Pushover, Slack, etc.
  curl -s --form-string "token=${PUSHOVER_TOKEN}" \
       --form-string "user=${PUSHOVER_USER}" \
       --form-string "message=Rentalin synthetic check: ${FAILURES} failures" \
       https://api.pushover.net/1/messages.json
fi
```

### 7.4 Offline Detection (UI Indicator)

Already covered in `src/lib/telemetry.ts`. Additionally, render a connectivity banner in the app shell:

```tsx
// src/components/OfflineBanner.tsx
"use client";
import { useEffect, useState } from "react";

export function OfflineBanner() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const onOffline = () => setOffline(true);
    const onOnline = () => setOffline(false);
    setOffline(!navigator.onLine);
    window.addEventListener("offline", onOffline);
    window.addEventListener("online", onOnline);
    return () => {
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("online", onOnline);
    };
  }, []);

  if (!offline) return null;
  return (
    <div className="fixed bottom-4 left-4 right-4 bg-amber-600 text-white px-4 py-2 rounded-lg text-sm text-center z-50">
      Anda sedang offline. Data akan disinkronkan saat koneksi pulih.
    </div>
  );
}
```

---

## 8. Database Monitoring

### 8.1 PostgreSQL (Production)

Enable `pg_stat_statements` extension for query analytics:

```sql
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Top 10 slowest queries (run periodically via cron or Grafana PostgreSQL data source)
SELECT
  queryid,
  LEFT(query, 150) AS query_preview,
  calls,
  mean_exec_time::numeric(10,2) AS avg_ms,
  max_exec_time::numeric(10,2) AS max_ms,
  stddev_exec_time::numeric(10,2) AS stddev_ms,
  rows,
  shared_blks_hit + shared_blks_read AS total_blocks
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

**Key PostgreSQL metrics to monitor:**

| Metric | Source | Alert Threshold |
|---|---|---|
| Active connections / max_connections | `pg_stat_activity` | > 80% |
| Dead tuples ratio | `pg_stat_user_tables` | > 20% |
| Transaction ID wraparound | `pg_current_wal_lsn()` | Age > 1B |
| Replication lag (bytes) | `pg_stat_replication` | > 100MB |
| Cache hit ratio | `pg_stat_database` | < 99% |
| Long-running queries | `pg_stat_activity` | > 30s |

**Vacuum monitoring:**
```sql
SELECT schemaname, relname,
       n_dead_tup, n_live_tup,
       ROUND(100.0 * n_dead_tup / NULLIF(n_live_tup + n_dead_tup, 0), 2) AS dead_ratio,
       last_vacuum, last_autovacuum
FROM pg_stat_user_tables
WHERE n_dead_tup > 1000
ORDER BY n_dead_tup DESC;
```

### 8.2 SQLite (Development / Single-VPS Production)

**Quick integrity check via cron:**
```bash
#!/bin/bash
# Run: */30 * * * * /opt/rentalin/scripts/sqlite_health.sh
DB_PATH="/opt/rentalin/rentalin.db"
BACKUP_DIR="/opt/rentalin/backups"

sqlite3 "$DB_PATH" "PRAGMA integrity_check;" || {
  echo "SQLite integrity check FAILED for ${DB_PATH}" | \
    curl -d @- ntfy.sh/rentalin-alerts
}

# Backup if integrity passes
cp "$DB_PATH" "${BACKUP_DIR}/rentalin_$(date +%Y%m%d_%H%M%S).db"
```

### 8.3 EF Core Connection Pool Monitoring

Add a health check for connection pool status:

```csharp
public sealed class ConnectionPoolHealthCheck : IHealthCheck
{
    private readonly RentalinDbContext _db;

    public ConnectionPoolHealthCheck(RentalinDbContext db) => _db = db;

    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context, CancellationToken ct)
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
            return HealthCheckResult.Unhealthy("Database connection check failed", ex);
        }
    }
}
```

### 8.4 Backup Verification

Weekly automated restore-and-verify:

```bash
#!/bin/bash
# restore_verify.sh — run weekly via cron

LATEST_BACKUP=$(ls -t /opt/rentalin/backups/*.dump | head -1)
VERIFY_DB="/tmp/rentalin_verify.db"

# For PostgreSQL:
pg_restore --clean --dbname="${VERIFY_DB}" "${LATEST_BACKUP}" 2>&1
VERIFY_RESULT=$?

# Run a known query to validate data integrity
EXPECTED_TABLES=$(psql -d "${VERIFY_DB}" -tAc "
  SELECT count(*) FROM information_schema.tables
  WHERE table_schema = 'public';")

if [ "$VERIFY_RESULT" -eq 0 ] && [ "$EXPECTED_TABLES" -ge 10 ]; then
  echo "Backup verification PASSED: ${LATEST_BACKUP}"
else
  echo "Backup verification FAILED: ${LATEST_BACKUP}" >&2
  exit 1
fi
```

---

## 9. Offline Sync Monitoring

When offline capability is implemented (likely via IndexedDB + service worker in the frontend):

### 9.1 Metrics to Track

| Metric | Description | Alert |
|---|---|---|
| `sync_queue_size` | Number of pending sync operations | P2 if > 50 for > 30 min |
| `sync_success_rate` | % of sync operations that succeed | P2 if < 90% for 1h |
| `sync_failure_rate` | Failed sync operations | P1 if > 10 failures in 10 min |
| `conflict_count` | Merge conflicts requiring manual resolution | P3 if > 5 in 24h |
| `last_sync_timestamp` | Most recent successful sync per device | P3 if > 24h stale |

### 9.2 Frontend Sync Queue Reporting

```typescript
// src/lib/syncMonitor.ts
interface SyncStats {
  queueSize: number;
  lastSyncTimestamp: string | null;
  pendingOperations: { type: string; entity: string; queuedAt: string }[];
}

export function reportSyncStats(stats: SyncStats): void {
  if (stats.queueSize > 50) {
    sendLog({
      level: "warn",
      message: `Sync queue growing: ${stats.queueSize} pending operations`,
      context: stats,
    });
  }
}
```

---

## 10. Recovery Plans

### 10.1 Database Failure

| Scenario | Recovery Procedure | RPO | RTO |
|---|---|---|---|
| **PostgreSQL crash** | systemd auto-restart; if persistent, restore from latest WAL + base backup | < 1 hour | < 30 min |
| **Corrupted data** | PITR to point before corruption using WAL archives | Variable | < 1 hour |
| **Disk failure** | Restore from off-site backup (S3-compatible) onto new volume | 24 hours | 2 hours |
| **SQLite corruption** | Replace with latest `sqlite_backup_*.db` from /opt/rentalin/backups | 30 min | 5 min |

**PostgreSQL WAL archiving** (`postgresql.conf`):
```
wal_level = replica
archive_mode = on
archive_command = 'aws s3 cp %p s3://rentalin-backups/wal/%f'
```

**Automated backup cron** (`/etc/cron.d/rentalin-backup`):
```
0 2 * * * postgres pg_dump -Fc rentalin | aws s3 cp - s3://rentalin-backups/daily/rentalin_$(date +\%Y\%m\%d).dump
0 3 * * 0 postgres pg_dump -Fc rentalin | aws s3 cp - s3://rentalin-backups/weekly/rentalin_$(date +\%Y\%m\%d).dump
```

### 10.2 Application Failure

| Scenario | Recovery Procedure |
|---|---|
| **Process crash** | systemd `Restart=always` + `RestartSec=5` |
| **Deployment failure** | CI/CD pipeline: keep last 3 known-good artifacts; rollback via `systemctl restart rentalin` pointing to previous artifact |
| **Memory leak** | systemd `MemoryMax=512M` triggers OOM kill → systemd auto-restart; P1 alert on 95% memory triggers manual investigation |
| **Deadlock/livelock** | Health check endpoint fails → load balancer stops routing → systemd timeout kill + restart |

**systemd unit file** (`/etc/systemd/system/rentalin.service`):

```ini
[Unit]
Description=Rentalin API
After=network.target postgresql.service

[Service]
Type=notify
WorkingDirectory=/opt/rentalin
ExecStart=/opt/rentalin/Rentalin.Api
Restart=always
RestartSec=5
MemoryMax=512M
Environment=ASPNETCORE_ENVIRONMENT=Production
Environment=DOTNET_GCRegionRange=0x200000,0x2000000

[Install]
WantedBy=multi-user.target
```

### 10.3 Storage Failure

| Scenario | Recovery Procedure |
|---|---|
| **Disk full** | Alert triggers at 70% (P3) and 90% (P1). Run log cleanup: `journalctl --vacuum-size=500M` + remove old log files |
| **Attachment storage loss** | Attachments backed up to S3-compatible storage (e.g., MinIO, AWS S3, Cloudflare R2). Restore from bucket |
| **Backup failure** | P2 alert on failed backup. Manual trigger + investigate. Rotate to new storage target if persistent |

**Log rotation** (`/etc/logrotate.d/rentalin`):
```
/var/log/rentalin/*.log {
    daily
    rotate 14
    compress
    delaycompress
    missingok
    notifempty
    copytruncate
    maxsize 100M
}
```

### 10.4 Network Failure (User Side)

| Scenario | Handling |
|---|---|
| **User goes offline** | `OfflineBanner` component shows; API calls fail gracefully; user can still view cached data |
| **User comes online** | Sync queued operations; show success/conflict notification |
| **Slow connection** | API client has 10s timeout; UI shows skeleton loaders, not spinners |
| **Server unreachable** | Health check endpoint returns 503; systemd restarts if unresponsive for 30s |

---

## 11. Dashboard

### 11.1 Grafana Dashboard Layout

Designed for a 1920x1080 display, refresh every 30 seconds.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Rentalin Operations Dashboard                          Last refresh: 2s ago │
├──────────┬──────────┬──────────┬──────────┬────────────────────────────────┤
│  Active  │Available │  Today's │  Error   │        API Latency (p95)       │
│ Rentals  │ Vehicles │ Revenue  │  Rate    │   ┌────────────────────────┐    │
│    ██    │    ██    │ Rp ██    │   █.██%  │   │  ▁▂▃▂█▃▂▁▂▁  p95: 320ms│    │
│     12   │    8/20  │ 4.200K  │   0.4%   │   └────────────────────────┘    │
├──────────┴──────────┴──────────┴──────────┴────────────────────────────────┤
│  Requests per Second                          Active Rentals Over Time      │
│  ┌──────────────────────────────────┐  ┌──────────────────────────────────┐ │
│  │ ▁▂▃▅▃▂▁▂▃▄▅▆▅▄▃▂▁   Avg: 12/s  │  │ ▁▁▂▂▃▃▄▄▅▅▆▆▆▇▇  Trend: ↑      │ │
│  └──────────────────────────────────┘  └──────────────────────────────────┘ │
├────────────────────────────────────────────────────────────────────────────┤
│  Database Health                          System Resources                  │
│  ┌──────────────────────────────────┐  ┌──────────────────────────────────┐ │
│  │ Connections:  8/20  ████░░░░░░  │  │ CPU:  ██████░░░░  45%            │ │
│  │ Dead Tuples:   120   ██░░░░░░░░  │  │ Mem:  ████████░░  78% 256/512MB │ │
│  │ Cache Hit:    99.8%  █████████░  │  │ Disk: █████████░  88%  11/15GB  │ │
│  │ Slow Queries:   0    ✓           │  │ GC:   0.45% pause ratio         │ │
│  └──────────────────────────────────┘  └──────────────────────────────────┘ │
├────────────────────────────────────────────────────────────────────────────┤
│  Recent Alerts                                                             │
│  ┌────────────────────────────────────────────────────────────────────────┐│
│  │ 12:45  WARN   API p95 latency exceeded 500ms (resolved 12:47)          ││
│  │ 11:30  INFO   Backup completed successfully (34MB, 2.1s)               ││
│  │ 02:00  OK     Nightly restore verification passed                      ││
│  └────────────────────────────────────────────────────────────────────────┘│
└────────────────────────────────────────────────────────────────────────────┘
```

### 11.2 Dashboard Provisioning (Grafana JSON Model)

Save as `grafana/dashboards/rentalin-operations.json`:

```json
{
  "dashboard": {
    "title": "Rentalin Operations",
    "refresh": "30s",
    "timezone": "Asia/Jakarta",
    "panels": [
      {
        "id": 1,
        "title": "Active Rentals",
        "type": "stat",
        "gridPos": { "x": 0, "y": 0, "w": 4, "h": 3 },
        "targets": [
          {
            "expr": "rentalin_active_rentals",
            "legendFormat": "Active"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "thresholds": { "mode": "absolute", "steps": [
              { "color": "green", "value": null },
              { "color": "orange", "value": 50 },
              { "color": "red", "value": 80 }
            ]}
          }
        }
      },
      {
        "id": 2,
        "title": "Available Vehicles",
        "type": "stat",
        "gridPos": { "x": 4, "y": 0, "w": 4, "h": 3 },
        "targets": [
          { "expr": "rentalin_available_vehicles", "legendFormat": "Available" }
        ],
        "fieldConfig": {
          "defaults": {
            "thresholds": { "mode": "absolute", "steps": [
              { "color": "red", "value": null },
              { "color": "orange", "value": 3 },
              { "color": "green", "value": 5 }
            ]}
          }
        }
      },
      {
        "id": 3,
        "title": "Today's Revenue",
        "type": "stat",
        "gridPos": { "x": 8, "y": 0, "w": 4, "h": 3 },
        "targets": [
          {
            "expr": "sum(increase(rentalin_payments_processed_total{status=\"completed\"}[24h]))",
            "legendFormat": "Revenue"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "decimals": 0,
            "unit": "currencyIDR"
          }
        }
      },
      {
        "id": 4,
        "title": "Error Rate",
        "type": "stat",
        "gridPos": { "x": 12, "y": 0, "w": 4, "h": 3 },
        "targets": [
          {
            "expr": "sum(rate(http_server_request_duration_seconds_count{status=~\"5..\"}[5m])) / sum(rate(http_server_request_duration_seconds_count[5m])) * 100",
            "legendFormat": "Error %"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "unit": "percent",
            "thresholds": { "mode": "absolute", "steps": [
              { "color": "green", "value": null },
              { "color": "orange", "value": 1 },
              { "color": "red", "value": 5 }
            ]},
            "decimals": 2
          }
        }
      },
      {
        "id": 5,
        "title": "API Latency (p50/p95/p99)",
        "type": "timeseries",
        "gridPos": { "x": 16, "y": 0, "w": 8, "h": 3 },
        "targets": [
          {
            "expr": "histogram_quantile(0.50, sum(rate(http_server_request_duration_seconds_bucket[5m])) by (le))",
            "legendFormat": "p50"
          },
          {
            "expr": "histogram_quantile(0.95, sum(rate(http_server_request_duration_seconds_bucket[5m])) by (le))",
            "legendFormat": "p95"
          },
          {
            "expr": "histogram_quantile(0.99, sum(rate(http_server_request_duration_seconds_bucket[5m])) by (le))",
            "legendFormat": "p99"
          }
        ],
        "fieldConfig": {
          "defaults": { "unit": "s", "decimals": 3 }
        }
      },
      {
        "id": 6,
        "title": "Requests Per Second",
        "type": "timeseries",
        "gridPos": { "x": 0, "y": 3, "w": 12, "h": 6 },
        "targets": [
          { "expr": "sum(rate(http_server_request_duration_seconds_count[1m]))", "legendFormat": "RPS" }
        ],
        "fieldConfig": { "defaults": { "unit": "reqps" } }
      },
      {
        "id": 7,
        "title": "Active Rentals Trend",
        "type": "timeseries",
        "gridPos": { "x": 12, "y": 3, "w": 12, "h": 6 },
        "targets": [
          { "expr": "rentalin_active_rentals", "legendFormat": "Active Rentals" }
        ]
      },
      {
        "id": 8,
        "title": "Database Health",
        "type": "row",
        "gridPos": { "x": 0, "y": 9, "w": 24, "h": 1 }
      },
      {
        "id": 9,
        "title": "DB Connections",
        "type": "gauge",
        "gridPos": { "x": 0, "y": 10, "w": 6, "h": 4 },
        "targets": [
          { "expr": "pg_stat_database_numbackends{datname=\"rentalin\"}", "legendFormat": "Connections" }
        ],
        "fieldConfig": {
          "defaults": {
            "unit": "none",
            "max": 20,
            "thresholds": { "mode": "absolute", "steps": [
              { "color": "green", "value": null },
              { "color": "orange", "value": 14 },
              { "color": "red", "value": 18 }
            ]}
          }
        }
      },
      {
        "id": 10,
        "title": "System Resources",
        "type": "timeseries",
        "gridPos": { "x": 6, "y": 10, "w": 9, "h": 4 },
        "targets": [
          { "expr": "100 - (avg by (instance) (rate(node_cpu_seconds_total{mode=\"idle\"}[5m])) * 100)", "legendFormat": "CPU %" },
          { "expr": "(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100", "legendFormat": "Memory %" }
        ],
        "fieldConfig": { "defaults": { "unit": "percent", "max": 100, "min": 0 } }
      },
      {
        "id": 11,
        "title": "Disk Usage",
        "type": "gauge",
        "gridPos": { "x": 15, "y": 10, "w": 4, "h": 4 },
        "targets": [
          { "expr": "100 - (node_filesystem_avail_bytes{mountpoint=\"/\"} / node_filesystem_size_bytes{mountpoint=\"/\"} * 100)", "legendFormat": "Disk %" }
        ],
        "fieldConfig": {
          "defaults": {
            "unit": "percent",
            "max": 100,
            "thresholds": { "mode": "absolute", "steps": [
              { "color": "green", "value": null },
              { "color": "orange", "value": 70 },
              { "color": "red", "value": 90 }
            ]}
          }
        }
      },
      {
        "id": 12,
        "title": "GC Pause Ratio",
        "type": "stat",
        "gridPos": { "x": 19, "y": 10, "w": 5, "h": 4 },
        "targets": [
          {
            "expr": "rate(dotnet_gc_collection_seconds_sum[5m]) / rate(dotnet_gc_collection_seconds_count[5m]) * 100",
            "legendFormat": "GC %"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "unit": "percent",
            "decimals": 2,
            "thresholds": { "mode": "absolute", "steps": [
              { "color": "green", "value": null },
              { "color": "orange", "value": 5 },
              { "color": "red", "value": 10 }
            ]}
          }
        }
      },
      {
        "id": 13,
        "title": "Recent Alerts",
        "type": "alertlist",
        "gridPos": { "x": 0, "y": 14, "w": 24, "h": 4 },
        "options": {
          "showOptions": { "showCurrent": true, "showRecentChanges": false },
          "maxItems": 10,
          "sortOrder": 1,
          "stateFilter": { "ok": true, "paused": true, "no_data": true, "execution_error": true, "alerting": true, "pending": true }
        }
      }
    ],
    "tags": ["rentalin", "operations"],
    "time": { "from": "now-1h", "to": "now" }
  }
}
```

---

## Appendix A — NuGet Packages Required

Add to `Rentalin.Api.csproj`:

```xml
<PackageReference Include="OpenTelemetry.Extensions.Hosting" Version="1.*" />
<PackageReference Include="OpenTelemetry.Exporter.OpenTelemetryProtocol" Version="1.*" />
<PackageReference Include="OpenTelemetry.Exporter.Prometheus.AspNetCore" Version="1.*" />
<PackageReference Include="OpenTelemetry.Instrumentation.AspNetCore" Version="1.*" />
<PackageReference Include="OpenTelemetry.Instrumentation.Http" Version="1.*" />
<PackageReference Include="OpenTelemetry.Instrumentation.EntityFrameworkCore" Version="1.*" />
<PackageReference Include="OpenTelemetry.Instrumentation.Runtime" Version="1.*" />
<PackageReference Include="Serilog.AspNetCore" Version="9.*" />
<PackageReference Include="Serilog.Enrichers.Environment" Version="3.*" />
<PackageReference Include="Serilog.Enrichers.Thread" Version="4.*" />
<PackageReference Include="Serilog.Formatting.Compact" Version="3.*" />
<PackageReference Include="Serilog.Sinks.Console" Version="6.*" />
<PackageReference Include="Serilog.Sinks.File" Version="6.*" />
<PackageReference Include="AspNetCore.HealthChecks.Npgsql" Version="9.*" />
<PackageReference Include="Microsoft.Extensions.Diagnostics.HealthChecks.EntityFrameworkCore" Version="10.*" />
```

## Appendix B — docker-compose.yml (Observability Stack)

```yaml
version: "3.9"
services:
  grafana:
    image: grafana/grafana:latest
    ports: ["3000:3000"]
    volumes:
      - grafana_data:/var/lib/grafana
      - ./grafana/dashboards:/etc/grafana/provisioning/dashboards

  loki:
    image: grafana/loki:latest
    ports: ["3100:3100"]
    volumes:
      - loki_data:/loki
      - ./loki-config.yaml:/etc/loki/local-config.yaml

  prometheus:
    image: prom/prometheus:latest
    ports: ["9090:9090"]
    volumes:
      - prometheus_data:/prometheus
      - ./prometheus.yml:/etc/prometheus/prometheus.yml

volumes:
  grafana_data:
  loki_data:
  prometheus_data:
```

---

## Appendix C — Checklist for Production Readiness

- [ ] Serilog configured with JSON output to file + console
- [ ] Correlation ID propagated from frontend → backend → handlers → EF Core
- [ ] PII masking applied to all log statements containing customer data
- [ ] Health check endpoints responding: `/health`, `/health/ready`, `/health/deep`
- [ ] Prometheus metrics exposed on `/metrics` (behind firewall or basic auth)
- [ ] Grafana dashboard imported and refreshing
- [ ] P1 alerts configured and tested (trigger a test alert)
- [ ] Backup script running, restore verified within last 7 days
- [ ] On-call rotation defined with escalation paths
- [ ] `systemd` unit file with `Restart=always` and `MemoryMax`
- [ ] Log rotation configured
- [ ] Frontend telemetry: error tracking, vitals, offline detection
- [ ] Synthetic health check hitting `/health/ready` from external network
- [ ] SSL certificate monitoring active
