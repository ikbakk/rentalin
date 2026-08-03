# Rentalin — Application Security Review

**Version:** Pre-MVP (2026-07-30)
**Reviewer:** Application Security Architect
**Classification:** Confidential — Internal Use Only
**Regulatory Context:** Indonesia UU PDP (Personal Data Protection Law)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Threat Model](#2-threat-model)
3. [Authentication & Authorization](#3-authentication--authorization)
4. [Data Protection](#4-data-protection)
5. [Data Retention](#5-data-retention)
6. [API Security](#6-api-security)
7. [File Upload Security](#7-file-upload-security)
8. [Frontend Security](#8-frontend-security)
9. [Infrastructure Security](#9-infrastructure-security)
10. [Incident Response Plan](#10-incident-response-plan)
11. [OWASP Top 10 Assessment](#11-owasp-top-10-2021-assessment)
12. [Compliance](#12-compliance)
13. [Security Checklist](#13-security-checklist)
14. [Code Examples](#14-code-examples)

---

## 1. Executive Summary

Rentalin is currently in a **pre-MVP state with critical security gaps**. The API layer has **zero authentication**, **unrestricted CORS**, **no rate limiting**, **no audit logging**, and **no encryption at rest**. All 10 API endpoint groups (`/api/businesses`, `/api/customers`, `/api/vehicles`, `/api/inquiries`, `/api/reservations`, `/api/rentals`, `/api/payments`, `/api/inspections`, `/api/staff`, `/api/attachments`, `/api/operations`, `/api/timeline`) are publicly accessible with full read/write access.

The application handles sensitive data under Indonesia's UU PDP, including customer PII (names, phone numbers, email addresses), payment records, vehicle documents, and inspection photos. The current architecture exposes this data to:
- Unauthenticated API access from any origin (CORS: `AllowAnyOrigin`)
- Direct SQLite file access (`rentalin.db` at `backend/src/Rentalin.Api/`)
- Lack of audit trail for any data modification or access

**Risk level: CRITICAL.** Immediate action is required before any production deployment.

---

## 2. Threat Model

### 2.1 STRIDE Analysis

| Component | Spoofing | Tampering | Repudiation | Info Disclosure | DoS | Elevation |
|-----------|----------|-----------|-------------|-----------------|-----|-----------|
| **API** | ✓ No auth — any actor can call any endpoint. `Program.cs:14` allows `AllowAnyOrigin` CORS. | ✓ No auth — anyone can POST/PUT mutations to create/update businesses, staff, vehicles, payments. `BusinessEndpoints.cs`, `StaffEndpoints.cs` have no authorization checks. | ✓ No audit — no logging of who performed actions. No user identity tracked in handlers. | ✓ PII exposure — `/api/customers` returns full names, phones, emails without auth. `/api/staff` exposes staff contact details. | ✓ No rate limit — no throttling middleware. `InspectionEndpoints.cs` accepts unlimited requests. | ✓ No roles — Staff entity has a `Role` string field but it is never checked in any endpoint. |
| **Database** | N/A (no application-level impersonation) | ✓ Direct file access — `rentalin.db` SQLite file in project root is plaintext, readable by any process with filesystem access. `ServiceCollectionExtensions.cs:17` configures `UseSqlite`. | ✓ No audit log — no audit table, no change tracking beyond domain events. | ✓ SQLite file readable — SQLite databases have no built-in encryption. Anyone with server access can copy and read the entire database. | ✓ Connection exhaustion — no connection pooling limits, no query timeout enforcement in `Repository.cs`. | ✓ No row-level security — `OperationsEndpoints.cs:16` queries all vehicles/payments without business scoping. |
| **Frontend** | ✓ No session mgmt — no auth tokens, no session state. `api.ts:3` sends plain requests with no auth header. | ✓ XSS possible — customer names, notes fields rendered without sanitization. `InquiryResponse.notes` field may contain user input. | N/A (client-side only) | ✓ Local storage PII — `@tanstack/react-query` caches query results including customer PII in memory. DTOs in `types.ts` carry full PII. | ✓ Bundle size — GSAP, motion, ogl (WebGL library) add ~300KB+ to bundle. No code splitting visible. | N/A |
| **File Uploads** | N/A | ✓ No file validation — `Attachment.Create()` at `Attachment.cs:21` accepts any content type and filename without server-side validation. | N/A | ✓ Unrestricted access — `Attachment.FileUrl` is stored as-is; no signed URL or access control planned. | ✓ Large file DoS — no file size validation in domain entity or endpoint. | N/A |

### 2.2 Threat Actors

| Actor | Motivation | Capability | Likelihood |
|-------|-----------|------------|------------|
| **External attacker (internet-facing)** | Financial gain, data theft, service disruption | Can discover and exploit unauthenticated API; runs automated scanners | **High** — no auth means even script kiddies can enumerate data |
| **Malicious staff member (insider)** | Data exfiltration, sabotage, selling customer data | Has legitimate access; can bypass nonexistent RBAC to read all data | **Medium** — requires staff access, but no detection once inside |
| **Accidental data exposure (staff error)** | Human error — wrong endpoint, misconfiguration | Can accidentally expose data through unsecured sharing or misconfiguration | **Medium** — no guardrails to prevent mistakes |
| **Physical device theft (phone/laptop)** | Opportunistic data access | Physical access to device with cached credentials or database files | **Low** — requires physical proximity, but SQLite file is portable |

### 2.3 Attack Vectors

1. **Unauthenticated API Access** (CRITICAL — currently exploitable)
   - All API endpoints are open. An attacker can enumerate all customers via `GET /api/customers` and export full PII.
   - `GET /api/staff` exposes staff names, emails, phones, roles. Enables targeted phishing.
   - `POST /api/staff` allows creating unauthorized staff accounts.
   - `POST /api/payments` permits fraudulent payment record creation.

2. **SQL Injection** (LOW — currently mitigated)
   - EF Core uses parameterized queries. `OperationsEndpoints.cs` uses LINQ which is safe.
   - No raw SQL found in codebase. Risk is low but should be verified in any future raw SQL additions.

3. **Cross-Site Scripting (XSS)** (MEDIUM — depends on frontend rendering)
   - Customer `Notes` fields and `Name` fields are user-provided and may be stored in the database.
   - If rendered without output encoding in Next.js, stored XSS is possible.
   - Inspection `notes` and `photoUrls` are additional injection vectors.

4. **Cross-Site Request Forgery (CSRF)** (HIGH — no protection)
   - All mutation endpoints (`POST`, `PUT`) lack anti-forgery tokens.
   - With `AllowAnyOrigin` CORS, any website can trigger state-changing requests if a staff member is tricked into visiting a malicious page (once auth is added).

5. **Path Traversal** (MEDIUM — future risk)
   - `Attachment.FileUrl` is stored without sanitization. When file serving is implemented, a malicious `fileUrl` like `../../../etc/passwd` could enable path traversal.

6. **Denial of Service (DoS)** (HIGH — no protection)
   - `GET /api/operations/summary` executes 6 database queries synchronously with no pagination.
   - `GET /api/operations/fleet-status` loads all vehicles without pagination.
   - No request size limits, no timeout configuration.

---

## 3. Authentication & Authorization

### 3.1 Current State

**No authentication implemented.** The `Program.cs` pipeline has no auth middleware:
```csharp
// Program.cs — current state (lines 7-38)
var builder = WebApplication.CreateBuilder(args);
builder.Services.AddInfrastructure("Data Source=rentalin.db");
// No AddAuthentication(), no AddAuthorization()
builder.Services.AddCors(o => o.AddDefaultPolicy(p =>
    p.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader())); // Unrestricted
// ...
app.UseCors();
// No app.UseAuthentication(), no app.UseAuthorization()
app.MapBusinessEndpoints(); // All endpoints unprotected
```

### 3.2 Required Implementation

#### Authentication Method
**Recommended: Magic link + OTP hybrid approach** suitable for Indonesia's mobile-first usage patterns.

| Method | Priority | Rationale |
|--------|----------|-----------|
| Email magic link | Primary | Low friction for staff; no password management |
| WhatsApp OTP | Secondary | High adoption in Indonesia; Twilio WhatsApp Business API |
| TOTP (Authenticator app) | Optional | For security-conscious owners |
| Password | None | Avoid entirely — password reuse and phishing risks |

#### Session Management
- **Access tokens:** JWT with 15-minute expiry, signed with RS256
- **Refresh tokens:** Opaque tokens stored in `HttpOnly`, `Secure`, `SameSite=Strict` cookies
- **Token rotation:** Refresh token rotated on each use; previous token revoked
- **Revocation list:** In-memory or Redis-backed blacklist for immediate logout

#### Authorization Matrix

| Resource | Owner | Manager | Staff |
|----------|-------|---------|-------|
| **Vehicles** | Full CRUD | Full CRUD | View only |
| **Customers** | Full CRUD | Full CRUD | Create, View |
| **Inquiries** | Full CRUD + confirm/cancel | Full CRUD + respond | Create, View |
| **Reservations** | Full CRUD + transition | Full CRUD + prepare/ready | View |
| **Rentals** | Full CRUD + start/complete | Full CRUD + start/complete | View |
| **Payments** | Full CRUD | View | — |
| **Inspections** | Full CRUD | Create, Complete | Create |
| **Timeline** | Full read | Full read | Filtered read |
| **Attachments** | Full CRUD | Upload, View | Upload, View |
| **Dashboard/Operations** | Full | Full | Filtered |
| **Business Settings** | Full | View | — |
| **Staff Management** | Full (create, deactivate) | — | — |
| **Reports** | Full | Full | — |

#### Row-Level Data Access
Each request must be scoped to the authenticated staff member's `BusinessId`. The `Staff.BusinessId` field (`Staff.cs:11`) must be enforced at the data access layer:

```csharp
// All queries must filter by BusinessId
_ = await db.Vehicles
    .Where(v => v.BusinessId == currentStaff.BusinessId)
    .ToListAsync(ct);
```

---

## 4. Data Protection

### 4.1 Data Classification

| Level | Data | Storage Location | Encryption Required |
|-------|------|-----------------|-------------------|
| **Critical** | Payment records (`Payment.Amount`, `Method`), Customer PII (`Customer.Name`, `Email`, `Phone`) | `RentalinDbContext` tables | AES-256 at rest + TLS 1.3 in transit |
| **Sensitive** | Vehicle documents, Inspection photos, Rental contracts, Staff contact info | `Attachment` table + file storage | AES-256 at rest + TLS 1.3 in transit |
| **Internal** | Business settings, Vehicle details (license plate, make/model), Timeline entries | `RentalinDbContext` tables | TLS 1.3 in transit |
| **Public** | None | N/A | N/A |

### 4.2 Encryption Requirements

#### Data at Rest
**Current:** SQLite database stored as plaintext file at `backend/src/Rentalin.Api/rentalin.db`. Anyone with filesystem access can read the entire database.

**Required for SQLite:** SQLCipher or `Microsoft.Data.Sqlite` with SEE (SQLite Encryption Extension):
```csharp
// ServiceCollectionExtensions.cs — modified with encryption
services.AddDbContext<RentalinDbContext>((sp, options) =>
{
    var connStr = new SqliteConnectionStringBuilder(connectionString)
    {
        Password = configuration["Database:EncryptionKey"]
    }.ToString();
    options.UseSqlite(connStr);
});
```

**Required for PostgreSQL (production):** TLS 1.3 with certificate verification, or TDE via filesystem encryption (LUKS/ecryptfs).

#### Data in Transit
**Current:** No TLS enforcement. The application runs over plain HTTP by default.

**Required:**
- TLS 1.3 minimum (TLS 1.2 allowed for legacy clients)
- HSTS header with `max-age=31536000; includeSubDomains; preload`
- HTTP → HTTPS redirect on reverse proxy
- Certificate managed via Let's Encrypt with auto-renewal

#### Backups
- Encrypt database backups using AES-256-GCM before storing
- Backup encryption key stored separately from backup storage
- Test restoration monthly

#### Secrets Management
**Current:** Connection string hardcoded in `Program.cs:9`:
```csharp
builder.Services.AddInfrastructure("Data Source=rentalin.db");
```

**Required:**
- Move all secrets to environment variables or a vault solution
- Use ASP.NET Core's configuration system:
```csharp
var connectionString = builder.Configuration.GetConnectionString("Default");
builder.Services.AddInfrastructure(connectionString);
```
- `.env` and `appsettings.*.json` files must not contain production secrets
- Rotate keys every 90 days

### 4.3 Key Management
- Use ASP.NET Core Data Protection API for application-level encryption
- Master key: stored in environment variable, never in source code or config files
- Key rotation: automated every 90 days with key versioning
- Previous keys retained for 180 days to decrypt historical data
- Key backup: encrypted export stored in offline secure storage

---

## 5. Data Retention

### 5.1 Retention Schedule

Per ADR: "Business-controlled data retention." The following minimums are recommended for UU PDP compliance:

| Data Category | Retention Period | Rationale | Deletion Method |
|--------------|-----------------|-----------|-----------------|
| **Rental contracts + payment records** | 5 years | Indonesian tax law (UU KUP) — 5-year record keeping | Soft delete → 30-day grace → permanent purge |
| **Customer PII** | 2 years after last rental | UU PDP — data minimization principle | Anonymize or delete after grace period |
| **Inspection photos** | 1 year | Operational value diminishes after 12 months | Permanent deletion after retention window |
| **Timeline/Activity logs** | 90 days | Operational debugging | Rolling deletion (FIFO) |
| **System logs** (structured) | 90 days | Incident investigation window | Log rotation with compression |
| **Analytics (raw)** | 12 months | Annual trend analysis | Delete raw; retain aggregated for 3 years |

### 5.2 Right to Deletion (UU PDP)

Business owners can request full data deletion. Requirements:
- Acknowledge request within 7 days
- Complete deletion within 30 days
- Provide deletion certificate
- Soft delete with 30-day grace period (reversible)
- Permanent purge after grace (irreversible, verified)

### 5.3 Implementation

```csharp
// Add to Entity base class
public abstract class Entity<TId>
{
    // ... existing fields ...
    public bool IsDeleted { get; protected set; }
    public DateTimeOffset? DeletedAt { get; protected set; }

    public void SoftDelete()
    {
        IsDeleted = true;
        DeletedAt = DateTimeOffset.UtcNow;
    }
}
```

Add a global query filter in `RentalinDbContext`:
```csharp
protected override void OnModelCreating(ModelBuilder modelBuilder)
{
    modelBuilder.ApplyConfigurationsFromAssembly(typeof(RentalinDbContext).Assembly);

    // Global soft-delete filter
    foreach (var entityType in modelBuilder.Model.GetEntityTypes())
    {
        if (typeof(ISoftDeletable).IsAssignableFrom(entityType.ClrType))
        {
            modelBuilder.Entity(entityType.ClrType)
                .HasQueryFilter(ConvertFilterExpression(entityType.ClrType));
        }
    }
}
```

---

## 6. API Security

### 6.1 Current Gaps

| Issue | Location | Severity |
|-------|----------|----------|
| No authentication | `Program.cs` — no `AddAuthentication()` | **CRITICAL** |
| Unrestricted CORS | `Program.cs:14` — `AllowAnyOrigin()` | **CRITICAL** |
| No rate limiting | All endpoints | **HIGH** |
| No input validation | All endpoint handlers | **HIGH** |
| No security headers | Missing from response pipeline | **MEDIUM** |
| No request size limits | All POST/PUT endpoints | **MEDIUM** |
| Connection string in source | `Program.cs:9` — hardcoded | **HIGH** |
| Direct DbContext injection | `OperationsEndpoints.cs:16` | **MEDIUM** |
| No API versioning | All route groups | **LOW** |

### 6.2 Required Configurations

#### Rate Limiting
```csharp
// Add to Program.cs
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

    options.AddFixedWindowLimiter("ApiPolicy", config =>
    {
        config.PermitLimit = 100;
        config.Window = TimeSpan.FromMinutes(1);
        config.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        config.QueueLimit = 0;
    });

    options.AddFixedWindowLimiter("AuthenticatedPolicy", config =>
    {
        config.PermitLimit = 1000;
        config.Window = TimeSpan.FromMinutes(1);
    });
});

// Apply per-endpoint or globally
app.UseRateLimiter();
```

#### Security Headers
```csharp
app.Use(async (context, next) =>
{
    var headers = context.Response.Headers;

    headers["X-Content-Type-Options"] = "nosniff";
    headers["X-Frame-Options"] = "DENY";
    headers["X-XSS-Protection"] = "0"; // Deprecated, but set to 0 to disable legacy behavior
    headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
    headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()";
    headers["Content-Security-Policy"] =
        "default-src 'self'; " +
        "script-src 'self'; " +
        "style-src 'self' 'unsafe-inline'; " +
        "img-src 'self' data: blob:; " +
        "font-src 'self'; " +
        "connect-src 'self'; " +
        "frame-ancestors 'none'; " +
        "base-uri 'self'; " +
        "form-action 'self';";

    if (!context.Request.IsHttps && !context.Request.Host.Host.Contains("localhost"))
    {
        headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload";
    }

    await next();
});
```

#### CORS
Replace the current `AllowAnyOrigin` with:
```csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy("RentalinCors", policy =>
    {
        policy.WithOrigins(
            builder.Configuration["Cors:FrontendOrigin"] ?? "https://rentalin.example.com"
        )
        .WithMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
        .WithHeaders("Authorization", "Content-Type", "X-Requested-With")
        .WithExposedHeaders("X-RateLimit-Limit", "X-RateLimit-Remaining", "X-RateLimit-Reset")
        .SetPreflightMaxAge(TimeSpan.FromMinutes(10));
    });
});
```

#### Input Validation
```csharp
// Validation endpoint filter
public sealed class ValidationFilter<T> : IEndpointFilter where T : class
{
    public async ValueTask<object?> InvokeAsync(
        EndpointFilterInvocationContext context, EndpointFilterDelegate next)
    {
        var argument = context.Arguments.OfType<T>().FirstOrDefault();
        if (argument is null)
        {
            return Results.BadRequest(new { error = "Request body is required." });
        }

        var validationContext = new ValidationContext(argument);
        var results = new List<ValidationResult>();

        if (!Validator.TryValidateObject(argument, validationContext, results, validateAllProperties: true))
        {
            var errors = results.ToDictionary(
                r => r.MemberNames.FirstOrDefault() ?? "body",
                r => new[] { r.ErrorMessage ?? "Invalid value." }
            );
            return Results.ValidationProblem(errors);
        }

        return await next(context);
    }
}
```

#### Request Size Limits
```csharp
// In Program.cs
builder.WebHost.ConfigureKestrel(options =>
{
    options.Limits.MaxRequestBodySize = 10 * 1024 * 1024; // 10MB for uploads
});

// Per-endpoint size limit for JSON bodies
builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.NumberHandling = JsonNumberHandling.Strict;
});
```

---

## 7. File Upload Security

### 7.1 Current State

The `Attachment` entity (`Attachment.cs`) stores file metadata but no upload pipeline exists yet. When implemented:

### 7.2 Requirements

```csharp
// Proposed upload handler
public sealed class FileUploadService
{
    private static readonly HashSet<string> AllowedContentTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "image/jpeg", "image/png", "image/webp", "image/heic",
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
    };

    private const long MaxFileSizeBytes = 10 * 1024 * 1024; // 10MB

    public async Task<Attachment> UploadAsync(
        IFormFile file, string referenceType, Guid referenceId, string uploadRoot)
    {
        // 1. Validate content type (not just extension)
        if (!AllowedContentTypes.Contains(file.ContentType))
            throw new DomainException($"File type '{file.ContentType}' is not allowed.");

        // 2. Validate file size
        if (file.Length > MaxFileSizeBytes)
            throw new DomainException($"File exceeds maximum size of {MaxFileSizeBytes / 1024 / 1024}MB.");

        // 3. Validate magic bytes (not just Content-Type header)
        await using var stream = file.OpenReadStream();
        var magicBytes = new byte[8];
        await stream.ReadAsync(magicBytes);
        stream.Position = 0;

        if (!IsValidMagicBytes(magicBytes, file.ContentType))
            throw new DomainException("File content does not match declared type.");

        // 4. Generate random filename (never use user-provided name)
        var extension = Path.GetExtension(file.FileName);
        var storedName = $"{Guid.NewGuid():N}{extension}";

        // 5. Store outside web root
        var storagePath = Path.Combine(uploadRoot, referenceType, referenceId.ToString());
        Directory.CreateDirectory(storagePath);
        var fullPath = Path.Combine(storagePath, storedName);

        // 6. Resolve path to prevent traversal
        var resolvedPath = Path.GetFullPath(fullPath);
        if (!resolvedPath.StartsWith(Path.GetFullPath(uploadRoot)))
            throw new SecurityException("Invalid file path.");

        await using var fileStream = File.Create(resolvedPath);
        await file.CopyToAsync(fileStream);

        // 7. Store relative path (not full path) in database
        var relativePath = Path.GetRelativePath(uploadRoot, resolvedPath);

        return Attachment.Create(
            referenceType, referenceId,
            Path.GetFileName(file.FileName), // original name for display
            file.ContentType,
            relativePath,
            file.Length);
    }

    // Signed URL for download — never expose direct file paths
    public string GenerateSignedUrl(string fileUrl, TimeSpan expiry)
    {
        var protector = _dataProtectionProvider.CreateProtector("FileDownload");
        var payload = $"{fileUrl}|{DateTimeOffset.UtcNow.Add(expiry):O}";
        var token = protector.Protect(payload);
        var encoded = WebEncoders.Base64UrlEncode(Encoding.UTF8.GetBytes(token));
        return $"/api/files/download?token={encoded}";
    }

    private static bool IsValidMagicBytes(byte[] header, string contentType)
    {
        return contentType switch
        {
            "image/jpeg" => header[0] == 0xFF && header[1] == 0xD8,
            "image/png" => header[0] == 0x89 && header[1] == 0x50 && header[2] == 0x4E && header[3] == 0x47,
            "image/webp" => header[0] == 0x52 && header[1] == 0x49 && header[2] == 0x46 && header[3] == 0x46,
            "application/pdf" => header[0] == 0x25 && header[1] == 0x50 && header[2] == 0x44 && header[3] == 0x46,
            _ => false
        };
    }
}
```

---

## 8. Frontend Security

### 8.1 Current Gaps

| Issue | Location | Severity |
|-------|----------|----------|
| No CSRF tokens | `api.ts` — plain fetch calls | **HIGH** |
| No CSP header from Next.js | `layout.tsx` — no security headers | **HIGH** |
| PII in client-side cache | `@tanstack/react-query` caches customer data in memory | **MEDIUM** |
| No SRI for CDN scripts | Currently no CDN usage, but future risk | **LOW** |
| No input sanitization | Customer name/notes rendered without escaping | **MEDIUM** |

### 8.2 Required Configurations

#### Content Security Policy (via next.config.ts)
```typescript
const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/((?!api).*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob:",
              "font-src 'self'",
              "connect-src 'self'",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};
```

#### CSRF Protection
```typescript
// Modified api.ts with CSRF token
const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

async function getCsrfToken(): Promise<string> {
  const res = await fetch(`${BASE_URL}/api/auth/csrf`, {
    credentials: "include",
  });
  const data = await res.json();
  return data.token;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options?.headers as Record<string, string>),
  };

  if (options?.method && options.method !== "GET") {
    headers["X-CSRF-TOKEN"] = await getCsrfToken();
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
    credentials: "include",
  });

  if (!res.ok) {
    if (res.status === 401) {
      window.location.href = "/login";
      throw new Error("Session expired");
    }
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message ?? `API error: ${res.status}`);
  }

  return res.json();
}
```

#### PII in Cache
```typescript
// providers.tsx — configure QueryClient to avoid PII in persistent cache
const [queryClient] = useState(() => new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 60_000, // Short garbage collection — don't persist PII
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
}));
```

#### Input Sanitization
Use a library like DOMPurify for any user-provided content rendered as HTML. For React, rely on React's built-in XSS protection (JSX auto-escapes). Never use `dangerouslySetInnerHTML` with user-provided content.

---

## 9. Infrastructure Security

### 9.1 Server Hardening

| Control | Current | Target |
|---------|---------|--------|
| Firewall | Unknown | Only ports 80, 443 open. All others closed. |
| SSH | Unknown | Key-only authentication, non-standard port (e.g., 2222), no root login |
| OS patching | Unknown | Automated weekly patching (unattended-upgrades) |
| Database exposure | SQLite file on disk | PostgreSQL on localhost only (not bound to 0.0.0.0) |
| Docker | Unknown | Non-root user, read-only root filesystem, `--cap-drop=ALL` |
| Reverse proxy | Not configured | nginx with security headers, TLS termination, rate limiting |

### 9.2 nginx Configuration (Recommended)
```nginx
server {
    listen 80;
    server_name rentalin.example.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name rentalin.example.com;

    ssl_certificate /etc/letsencrypt/live/rentalin.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/rentalin.example.com/privkey.pem;
    ssl_protocols TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-XSS-Protection "0" always;

    client_max_body_size 10M;

    limit_req_zone $binary_remote_addr zone=api:10m rate=100r/m;
    limit_req_zone $http_x_forwarded_for zone=auth:10m rate=10r/m;

    location /api/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 30s;
    }

    location /api/auth/ {
        limit_req zone=auth burst=5 nodelay;
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 9.3 Fail2ban Configuration
```ini
# /etc/fail2ban/jail.local
[rentalin-api]
enabled = true
port = 80,443
filter = rentalin-api
logpath = /var/log/nginx/rentalin-access.log
maxretry = 10
findtime = 60
bantime = 3600
```

### 9.4 Docker Security
```dockerfile
FROM mcr.microsoft.com/dotnet/aspnet:10.0
RUN useradd -m -u 1000 rentalin
USER rentalin
WORKDIR /app
COPY --chown=rentalin:rentalin ./publish .
EXPOSE 5000
ENTRYPOINT ["dotnet", "Rentalin.Api.dll"]
```

---

## 10. Incident Response Plan

### 10.1 Detection
- **Automated:** Uptime monitoring (health check endpoint), error rate spikes, failed auth attempts
- **Manual:** User reports, staff observations, security scans

### 10.2 Response Phases

| Phase | Actions | Timeline |
|-------|---------|----------|
| **1. Containment** | Isolate affected systems; revoke all active tokens/sessions; block suspicious IPs at firewall; take system offline if necessary | Immediate |
| **2. Investigation** | Determine scope (which data, how many records); identify root cause; preserve forensic evidence (logs, DB snapshot, memory dumps); document timeline | Within 4 hours |
| **3. Remediation** | Fix vulnerability; rotate all secrets/keys; verify fix with penetration test; restore clean backup if needed | Within 24 hours |
| **4. Notification** | Inform affected businesses (data breach notification); report to authority if required (UU PDP: 72 hours); provide guidance to affected parties | Within 72 hours |
| **5. Post-mortem** | Document full incident timeline; identify root cause; update security controls to prevent recurrence; share lessons with team | Within 1 week |

### 10.3 Severity Levels

| Severity | Definition | Response SLA | Escalation |
|----------|-----------|-------------|------------|
| **Sev1 — Critical** | Confirmed data breach, system compromise, ransomware | 1 hour | Owner + all staff |
| **Sev2 — High** | Service disruption, auth bypass, suspected breach | 4 hours | Owner + Manager |
| **Sev3 — Medium** | Vulnerability discovered, suspicious activity, minor data leak | 24 hours | Manager |
| **Sev4 — Low** | Minor configuration issue, non-critical bug | 1 week | Staff |

### 10.4 Emergency Contacts Template
| Role | Name | Phone | Email |
|------|------|-------|-------|
| Incident Commander | [TBD] | [TBD] | [TBD] |
| Technical Lead | [TBD] | [TBD] | [TBD] |
| Data Protection Officer | [TBD] | [TBD] | [TBD] |
| Legal Counsel | [TBD] | [TBD] | [TBD] |
| Hosting Provider Support | [TBD] | [TBD] | [TBD] |

---

## 11. OWASP Top 10 (2021) Assessment

| # | Category | Current Risk | Detailed Assessment |
|---|----------|-------------|---------------------|
| **A01** | **Broken Access Control** | ![CRITICAL](https://img.shields.io/badge/-CRITICAL-red) | **No authentication exists.** All 10 endpoint groups are publicly accessible with full read/write. `Program.cs` lacks `AddAuthentication()` and `AddAuthorization()`. CORS is set to `AllowAnyOrigin()`. Staff `Role` field exists but is never checked. No row-level scoping — any request can access any business's data. |
| **A02** | **Cryptographic Failures** | ![HIGH](https://img.shields.io/badge/-HIGH-orange) | **No TLS enforcement.** No HSTS header. SQLite database is plaintext — `rentalin.db` file can be copied and read directly. Connection string hardcoded in source. No encryption at rest for any PII. `appsettings.json` has no certificate configuration. |
| **A03** | **Injection** | ![LOW](https://img.shields.io/badge/-LOW-green) | EF Core parameterized queries are used throughout. `OperationsEndpoints.cs` uses LINQ (`Where`, `CountAsync`, `Select`), which is safe. No raw SQL found. Risk remains low if raw SQL is never introduced. |
| **A04** | **Insecure Design** | ![MEDIUM](https://img.shields.io/badge/-MEDIUM-yellow) | No rate limiting. No input validation middleware. No request size limits — Kestrel defaults apply. No API versioning (`/api/` paths are unversioned). No structured error handling (stack traces may leak in dev mode). |
| **A05** | **Security Misconfiguration** | ![MEDIUM](https://img.shields.io/badge/-MEDIUM-yellow) | Default configurations throughout. No CSP headers. No security headers (X-Frame-Options, X-Content-Type-Options, Referrer-Policy). `appsettings.json` has `"AllowedHosts": "*"`. `Rentalin.Api.http` file may contain test data. |
| **A06** | **Vulnerable and Outdated Components** | ![LOW](https://img.shields.io/badge/-LOW-green) | .NET 10, Next.js 16, EF Core 10 — all current. Dependencies appear recent. `npm audit` and `dotnet list package --vulnerable` should run in CI pipeline. No known vulnerable packages detected at review time. |
| **A07** | **Identification and Authentication Failures** | ![CRITICAL](https://img.shields.io/badge/-CRITICAL-red) | **No authentication at all.** No login mechanism. No session management. No password policy (not applicable in current state). No multi-factor authentication. No account lockout. No credential recovery flow. |
| **A08** | **Software and Data Integrity Failures** | ![LOW](https://img.shields.io/badge/-LOW-green) | NuGet packages use signed feeds by default. No CI/CD pipeline visible yet to verify. No third-party JavaScript from CDNs. No deserialization of untrusted data (MediatR and System.Text.Json are safe). |
| **A09** | **Security Logging and Monitoring Failures** | ![MEDIUM](https://img.shields.io/badge/-MEDIUM-yellow) | No audit logging. Domain events exist (`DomainEventDispatchingInterceptor.cs`) but are not persisted. No structured logging (Serilog/NLog not configured). No centralized log aggregation. No intrusion detection system. `appsettings.json` logging config is minimal (default levels only). |
| **A10** | **Server-Side Request Forgery (SSRF)** | ![LOW](https://img.shields.io/badge/-LOW-green) | Minimal external API calls at this stage. No user-controlled URLs in backend. Future risk if payment gateway integration, WhatsApp API, or email sending is added — must validate and restrict outbound requests. |

---

## 12. Compliance

### 12.1 Indonesia UU PDP (Personal Data Protection Law)

The application handles "Data Pribadi" (personal data) of Indonesian customers as defined by UU No. 27 Tahun 2022.

| Requirement | Status | Action Required |
|-------------|--------|-----------------|
| **Data subject rights** (access, correction, deletion) | Not implemented | Add customer self-service portal or staff-assisted data request workflow |
| **Data processing consent** | Not implemented | Add consent collection during customer creation; store consent timestamp |
| **Data breach notification** (72 hours to authority) | Not implemented | Establish notification procedure; identify competent authority (Kominfo) |
| **Cross-border data transfer restrictions** | Not applicable (single VPS in Indonesia) | If cloud hosting expands, ensure data remains in Indonesian jurisdiction |
| **Data Protection Officer (DPO) appointment** | Not done | Appoint a DPO (can be the business owner for small operations) |
| **Data processing record (DPR)** | Not done | Maintain record of all data processing activities |
| **Data minimization** | Partial | Already minimal schema; ensure unused fields are not collected |
| **Purpose limitation** | Not enforced | Document specific purposes for each data category collected |

### 12.2 Payment Card Data (PCI DSS)

If Rentalin handles card payments in the future:

- **Do not store card numbers, CVV, or expiry dates** in any form
- Use a PCI-compliant payment gateway with tokenization (Midtrans/Xendit for Indonesia)
- Store only the gateway's transaction reference token
- PCI SAQ (Self-Assessment Questionnaire) applies based on integration method
- SAQ A (fully outsourced) is the lightest compliance path — use hosted payment pages

### 12.3 Data Processing Record Template

| Data Category | Purpose | Legal Basis | Retention | Recipients | Cross-Border |
|--------------|---------|-------------|-----------|------------|--------------|
| Customer name, phone, email | Rental contract management | Contract performance | 2 years after last rental | Staff members only | No |
| Payment records | Financial records, tax compliance | Legal obligation (UU KUP) | 5 years | Staff, accountant, tax authority | No |
| Inspection photos | Vehicle condition verification | Legitimate interest | 1 year | Staff members only | No |
| Vehicle documents (STNK, insurance) | Regulatory compliance, fleet management | Legal obligation | Duration of vehicle ownership | Staff members | No |
| Staff contact information | Employment administration | Contract performance | Duration of employment + 2 years | Owner, HR | No |

---

## 13. Security Checklist

### Implementation Priorities (ordered by risk)

#### Phase 1 — Critical (Before any production exposure)

- [ ] **1. Implement JWT authentication**
  - Add `Microsoft.AspNetCore.Authentication.JwtBearer` package
  - Configure JWT validation in `Program.cs`
  - Create `/api/auth/login` (magic link), `/api/auth/callback`, `/api/auth/refresh`
  - Create `StaffAuth` entity for credentials/tokens

- [ ] **2. Add authorization (roles + permissions)**
  - Define role enum: `Owner`, `Manager`, `Staff`
  - Implement `AuthorizeAttribute` with role checks
  - Add `RequireAuthorization()` to all endpoint groups
  - Implement business-scoped data access filter

- [ ] **3. Enable TLS 1.3 + HSTS**
  - Configure nginx as reverse proxy with Let's Encrypt
  - Add `app.UseHttpsRedirection()` and `app.UseHsts()` in pipeline
  - Redirect HTTP to HTTPS at reverse proxy level

- [ ] **4. Add rate limiting**
  - Add `AddRateLimiter()` in `Program.cs`
  - Apply 100 req/min per IP globally
  - Apply 10 req/min on auth endpoints

- [ ] **5. Restrict CORS**
  - Replace `AllowAnyOrigin()` with specific frontend origin
  - Remove `AllowAnyHeader()` — specify allowed headers
  - Add `WithMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")`

#### Phase 2 — High (Before production data entry)

- [ ] **6. Add input validation middleware**
  - Create validation endpoint filter
  - Add DataAnnotations to all request DTOs
  - Validate email format, phone format, required fields
  - Reject unexpected JSON fields

- [ ] **7. Implement audit logging**
  - Add `AuditLog` entity (actor, action, target, timestamp, changes)
  - Log all CUD operations with staff identity
  - Store in separate audit log table
  - Implement log retention (90 days)

- [ ] **8. Encrypt database at rest**
  - For SQLite: SQLCipher or SEE encryption
  - For PostgreSQL: TDE or filesystem encryption (LUKS)
  - Store encryption key in environment variable, not in config

- [ ] **9. Configure security headers**
  - Add CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy
  - Configure in nginx and ASP.NET Core pipeline
  - Test with securityheaders.com

- [ ] **10. Add CSRF protection**
  - Implement anti-forgery token generation on login
  - Validate `X-CSRF-TOKEN` header on all mutation endpoints
  - Use `SameSite=Strict` cookies

#### Phase 3 — Medium (Before scaling beyond single business)

- [ ] **11. Secrets management**
  - Move all secrets to environment variables
  - Remove hardcoded connection strings
  - Prevent `appsettings.json` from containing production secrets

- [ ] **12. API versioning**
  - Add `/api/v1/` prefix to all routes
  - Configure API versioning with `Microsoft.AspNetCore.Mvc.Versioning`
  - Plan deprecation policy

- [ ] **13. Set up intrusion detection**
  - Configure fail2ban with custom filters
  - Monitor for brute force attempts
  - Set up alerting for unusual patterns

- [ ] **14. Input sanitization (frontend)**
  - Review all places where user input is rendered
  - Ensure React's built-in XSS protection is leveraged
  - Audit for any `dangerouslySetInnerHTML` usage

- [ ] **15. Dependency audit in CI**
  - Run `npm audit --audit-level=high` in CI pipeline
  - Run `dotnet list package --vulnerable` in CI pipeline
  - Block builds on critical vulnerabilities

#### Phase 4 — Low (Ongoing)

- [ ] **16. Regular penetration testing**
  - Annual third-party penetration test
  - Quarterly internal security review
  - Bug bounty program (optional, for later stage)

- [ ] **17. Security training for staff**
  - Phishing awareness
  - Secure data handling procedures
  - Incident reporting protocol

- [ ] **18. Backup encryption and testing**
  - Encrypt all database backups
  - Test restoration procedure monthly
  - Store backups in separate location

---

## 14. Code Examples

### 14.1 JWT Authentication Setup

```csharp
// Rentalin.Infrastructure/Auth/JwtService.cs
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace Rentalin.Infrastructure.Auth;

public interface IJwtService
{
    string GenerateAccessToken(Guid staffId, string email, string role, Guid businessId);
    string GenerateRefreshToken();
    ClaimsPrincipal? ValidateToken(string token);
}

public sealed class JwtService : IJwtService
{
    private readonly RSA _rsa;
    private readonly IConfiguration _config;

    public JwtService(IConfiguration config)
    {
        _config = config;
        _rsa = RSA.Create(2048);

        var privateKeyPath = config["Jwt:PrivateKeyPath"];
        if (!string.IsNullOrEmpty(privateKeyPath) && File.Exists(privateKeyPath))
        {
            _rsa.ImportFromPem(File.ReadAllText(privateKeyPath));
        }
    }

    public string GenerateAccessToken(Guid staffId, string email, string role, Guid businessId)
    {
        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, staffId.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, email),
            new Claim("role", role),
            new Claim("business_id", businessId.ToString()),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new Claim(JwtRegisteredClaimNames.Iat,
                DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString())
        };

        var credentials = new SigningCredentials(
            new RsaSecurityKey(_rsa), SecurityAlgorithms.RsaSha256);

        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"],
            audience: _config["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(15),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public string GenerateRefreshToken()
    {
        var randomBytes = new byte[64];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomBytes);
        return Convert.ToBase64String(randomBytes);
    }

    public ClaimsPrincipal? ValidateToken(string token)
    {
        var handler = new JwtSecurityTokenHandler();
        var parameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = _config["Jwt:Issuer"],
            ValidAudience = _config["Jwt:Audience"],
            IssuerSigningKey = new RsaSecurityKey(_rsa),
            ClockSkew = TimeSpan.Zero
        };

        try
        {
            return handler.ValidateToken(token, parameters, out _);
        }
        catch
        {
            return null;
        }
    }
}
```

### 14.2 Auth Endpoints

```csharp
// Rentalin.Api/Endpoints/AuthEndpoints.cs
using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.EntityFrameworkCore;
using Rentalin.Infrastructure.Auth;
using Rentalin.Infrastructure.Data;

namespace Rentalin.Api.Endpoints;

public static class AuthEndpoints
{
    public static void MapAuthEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/auth")
            .AllowAnonymous()
            .RequireRateLimiting("AuthPolicy");

        group.MapPost("/request-link", async (
            LoginRequest request,
            RentalinDbContext db,
            IJwtService jwt,
            CancellationToken ct) =>
        {
            var staff = await db.Staff
                .FirstOrDefaultAsync(s =>
                    s.Email == request.Email && s.IsActive, ct);

            if (staff is null)
            {
                // Return success to prevent email enumeration
                return Results.Ok(new { message = "If the email is registered, a login link has been sent." });
            }

            var token = jwt.GenerateRefreshToken();
            var expiresAt = DateTimeOffset.UtcNow.AddMinutes(10);

            // Store magic link token with TTL
            db.Set<MagicLinkToken>().Add(new MagicLinkToken
            {
                Id = Guid.NewGuid(),
                StaffId = staff.Id,
                Token = token,
                ExpiresAt = expiresAt,
                Used = false
            });
            await db.SaveChangesAsync(ct);

            // Send email via SendGrid/Mailgun/Resend
            // await _emailService.SendMagicLinkAsync(staff.Email, token);

            return Results.Ok(new { message = "If the email is registered, a login link has been sent." });
        });

        group.MapGet("/callback", async (
            string token,
            RentalinDbContext db,
            IJwtService jwt,
            HttpContext httpContext,
            CancellationToken ct) =>
        {
            var magicLink = await db.Set<MagicLinkToken>()
                .FirstOrDefaultAsync(m =>
                    m.Token == token && !m.Used && m.ExpiresAt > DateTimeOffset.UtcNow, ct);

            if (magicLink is null)
                return Results.Redirect("/login?error=invalid_or_expired_link");

            magicLink.Used = true;
            await db.SaveChangesAsync(ct);

            var staff = await db.Staff.FindAsync([magicLink.StaffId], ct);
            if (staff is null || !staff.IsActive)
                return Results.Redirect("/login?error=account_inactive");

            var accessToken = jwt.GenerateAccessToken(
                staff.Id, staff.Email, staff.Role, staff.BusinessId);
            var refreshToken = jwt.GenerateRefreshToken();

            // Set HttpOnly cookies
            httpContext.Response.Cookies.Append("access_token", accessToken, new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                SameSite = SameSiteMode.Strict,
                Expires = DateTimeOffset.UtcNow.AddMinutes(15)
            });

            httpContext.Response.Cookies.Append("refresh_token", refreshToken, new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                SameSite = SameSiteMode.Strict,
                Expires = DateTimeOffset.UtcNow.AddDays(7),
                Path = "/api/auth/refresh"
            });

            return Results.Redirect("/dashboard");
        });

        group.MapPost("/refresh", async (HttpContext httpContext, IJwtService jwt, CancellationToken ct) =>
        {
            var refreshToken = httpContext.Request.Cookies["refresh_token"];
            if (string.IsNullOrEmpty(refreshToken))
                return Results.Unauthorized();

            // Validate and rotate refresh token
            // ... (token rotation logic with revocation)

            return Results.Ok();
        });

        group.MapPost("/logout", (HttpContext httpContext) =>
        {
            httpContext.Response.Cookies.Delete("access_token");
            httpContext.Response.Cookies.Delete("refresh_token");
            return Results.Ok();
        });

        group.MapGet("/csrf", (HttpContext httpContext) =>
        {
            // Generate anti-forgery token
            var token = Guid.NewGuid().ToString("N");
            httpContext.Response.Cookies.Append("XSRF-TOKEN", token, new CookieOptions
            {
                HttpOnly = false, // Must be readable by JS
                Secure = true,
                SameSite = SameSiteMode.Strict
            });
            return Results.Ok(new { token });
        });
    }
}

public sealed record LoginRequest(string Email);
```

### 14.3 Authorization Middleware

```csharp
// Rentalin.Infrastructure/Auth/AuthorizationPolicies.cs
using Microsoft.AspNetCore.Authorization;

namespace Rentalin.Infrastructure.Auth;

public static class AuthorizationPolicies
{
    public const string OwnerOnly = "OwnerOnly";
    public const string ManagerOrAbove = "ManagerOrAbove";
    public const string StaffOrAbove = "StaffOrAbove";

    public static void AddRentalinAuthorization(this IServiceCollection services)
    {
        services.AddAuthorization(options =>
        {
            options.AddPolicy(OwnerOnly, policy =>
                policy.RequireClaim("role", "Owner"));

            options.AddPolicy(ManagerOrAbove, policy =>
                policy.RequireClaim("role", "Owner", "Manager"));

            options.AddPolicy(StaffOrAbove, policy =>
                policy.RequireClaim("role", "Owner", "Manager", "Staff"));
        });
    }
}

// Usage in Program.cs
// builder.Services.AddRentalinAuthorization();
// ...
// app.MapGroup("/api/vehicles").RequireAuthorization(StaffOrAbove);
// app.MapGroup("/api/staff").RequireAuthorization(OwnerOnly);
```

### 14.4 Business-Scoped Data Access

```csharp
// Rentalin.Infrastructure/Auth/StaffContext.cs
using System.Security.Claims;

namespace Rentalin.Infrastructure.Auth;

public interface IStaffContext
{
    Guid StaffId { get; }
    Guid BusinessId { get; }
    string Role { get; }
    string Email { get; }
}

public sealed class StaffContext : IStaffContext
{
    public Guid StaffId { get; }
    public Guid BusinessId { get; }
    public string Role { get; }
    public string Email { get; }

    public StaffContext(IHttpContextAccessor httpContextAccessor)
    {
        var user = httpContextAccessor.HttpContext?.User
            ?? throw new UnauthorizedAccessException("No authenticated user.");

        StaffId = Guid.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? throw new UnauthorizedAccessException("Missing staff ID claim."));
        BusinessId = Guid.Parse(user.FindFirstValue("business_id")
            ?? throw new UnauthorizedAccessException("Missing business ID claim."));
        Role = user.FindFirstValue("role")
            ?? throw new UnauthorizedAccessException("Missing role claim.");
        Email = user.FindFirstValue(ClaimTypes.Email)
            ?? throw new UnauthorizedAccessException("Missing email claim.");
    }
}

// Scoped query filter — applied in all repository/query operations
public static class QueryableExtensions
{
    public static IQueryable<T> ScopeToBusiness<T>(
        this IQueryable<T> query, IStaffContext staff) where T : class
    {
        if (staff.Role == "Owner")
            return query; // Owner sees all

        // For Manager/Staff, filter by their business
        var businessIdProperty = typeof(T).GetProperty("BusinessId");
        if (businessIdProperty is null)
            return query;

        var parameter = Expression.Parameter(typeof(T), "e");
        var property = Expression.Property(parameter, businessIdProperty);
        var value = Expression.Constant(staff.BusinessId);
        var equals = Expression.Equal(property, value);
        var lambda = Expression.Lambda<Func<T, bool>>(equals, parameter);

        return query.Where(lambda);
    }
}
```

### 14.5 Audit Logging Interceptor

```csharp
// Rentalin.Infrastructure/Data/Interceptors/AuditLogInterceptor.cs
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;

namespace Rentalin.Infrastructure.Data.Interceptors;

public sealed class AuditLogInterceptor : SaveChangesInterceptor
{
    private readonly IStaffContext _staffContext;

    public AuditLogInterceptor(IStaffContext staffContext)
    {
        _staffContext = staffContext;
    }

    public override async ValueTask<InterceptionResult<int>> SavingChangesAsync(
        DbContextEventData eventData,
        InterceptionResult<int> result,
        CancellationToken cancellationToken = default)
    {
        if (eventData.Context is null)
            return result;

        var entries = eventData.Context.ChangeTracker.Entries()
            .Where(e => e.State is EntityState.Added or EntityState.Modified or EntityState.Deleted);

        foreach (var entry in entries)
        {
            var auditEntry = new AuditEntry
            {
                Id = Guid.NewGuid(),
                EntityName = entry.Entity.GetType().Name,
                EntityId = entry.Property("Id").CurrentValue?.ToString() ?? "unknown",
                Action = entry.State.ToString(),
                StaffId = _staffContext.StaffId,
                StaffEmail = _staffContext.Email,
                Timestamp = DateTimeOffset.UtcNow,
                Changes = entry.State switch
                {
                    EntityState.Added => SerializeNewValues(entry),
                    EntityState.Modified => SerializeChanges(entry),
                    EntityState.Deleted => SerializeDeletedValues(entry),
                    _ => "{}"
                }
            };

            eventData.Context.Set<AuditEntry>().Add(auditEntry);
        }

        return result;
    }

    private static string SerializeChanges(EntityEntry entry)
    {
        var changes = new Dictionary<string, object?>();
        foreach (var property in entry.Properties.Where(p => p.IsModified))
        {
            changes[property.Metadata.Name] = new
            {
                old = property.OriginalValue,
                @new = property.CurrentValue
            };
        }
        return System.Text.Json.JsonSerializer.Serialize(changes);
    }

    private static string SerializeNewValues(EntityEntry entry)
    {
        var values = new Dictionary<string, object?>();
        foreach (var property in entry.Properties)
        {
            values[property.Metadata.Name] = property.CurrentValue;
        }
        return System.Text.Json.JsonSerializer.Serialize(values);
    }

    private static string SerializeDeletedValues(EntityEntry entry)
    {
        var values = new Dictionary<string, object?>();
        foreach (var property in entry.Properties)
        {
            values[property.Metadata.Name] = property.OriginalValue;
        }
        return System.Text.Json.JsonSerializer.Serialize(values);
    }

    // Redact PII from audit logs
    private static readonly HashSet<string> PiiFields = new(StringComparer.OrdinalIgnoreCase)
    {
        "Email", "Phone", "PhoneNumber", "Name", "LicensePlate"
    };

    private static object? RedactIfPii(string fieldName, object? value)
    {
        if (PiiFields.Contains(fieldName) && value is string s && s.Length > 0)
            return s[..1] + new string('*', s.Length - 1);
        return value;
    }
}
```

### 14.6 Complete Program.cs (Secured)

```csharp
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.RateLimiting;
using Rentalin.Api.Endpoints;
using Rentalin.Fleet.Domain.Entities;
using Rentalin.Infrastructure.Auth;
using Rentalin.Infrastructure.Data.Interceptors;
using Rentalin.Infrastructure.Extensions;
using Rentalin.Reservations.Domain.Entities;
using Rentalin.Timeline.Domain.Entities;

var builder = WebApplication.CreateBuilder(args);

// -- Configuration
var connectionString = builder.Configuration.GetConnectionString("Default")
    ?? throw new InvalidOperationException("Connection string 'Default' not found.");

// -- Infrastructure
builder.Services.AddInfrastructure(connectionString);

// -- Authentication
builder.Services.AddAuthentication()
    .AddJwtBearer(options =>
    {
        var rsa = System.Security.Cryptography.RSA.Create();
        var publicKeyPath = builder.Configuration["Jwt:PublicKeyPath"];
        if (!string.IsNullOrEmpty(publicKeyPath))
        {
            rsa.ImportFromPem(System.IO.File.ReadAllText(publicKeyPath));
        }
        options.TokenValidationParameters = new()
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new Microsoft.IdentityModel.Tokens.RsaSecurityKey(rsa),
            ClockSkew = System.TimeSpan.Zero
        };

        options.Events = new()
        {
            OnMessageReceived = context =>
            {
                // Read JWT from HttpOnly cookie
                var token = context.Request.Cookies["access_token"];
                if (!string.IsNullOrEmpty(token))
                    context.Token = token;
                return System.Threading.Tasks.Task.CompletedTask;
            }
        };
    });

// -- Authorization
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("OwnerOnly", p => p.RequireClaim("role", "Owner"));
    options.AddPolicy("ManagerOrAbove", p => p.RequireClaim("role", "Owner", "Manager"));
    options.AddPolicy("StaffOrAbove", p => p.RequireClaim("role", "Owner", "Manager", "Staff"));
});

builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<IStaffContext, StaffContext>();
builder.Services.AddScoped<IJwtService, JwtService>();
builder.Services.AddSingleton<AuditLogInterceptor>();

// -- MediatR
builder.Services.AddMediatR(cfg => cfg.RegisterServicesFromAssemblyContaining<Vehicle>());
builder.Services.AddMediatR(cfg => cfg.RegisterServicesFromAssemblyContaining<Inquiry>());
builder.Services.AddMediatR(cfg => cfg.RegisterServicesFromAssemblyContaining<TimelineEntry>());

// -- Rate Limiting
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddFixedWindowLimiter("GlobalPolicy", config =>
    {
        config.PermitLimit = 100;
        config.Window = System.TimeSpan.FromMinutes(1);
        config.QueueLimit = 0;
    });
    options.AddFixedWindowLimiter("AuthPolicy", config =>
    {
        config.PermitLimit = 10;
        config.Window = System.TimeSpan.FromMinutes(1);
        config.QueueLimit = 0;
    });
});

// -- CORS
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins(builder.Configuration["Cors:FrontendOrigin"]
                ?? "https://localhost:3000")
            .WithMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
            .WithHeaders("Authorization", "Content-Type", "X-CSRF-TOKEN")
            .WithExposedHeaders("X-RateLimit-Limit", "X-RateLimit-Remaining")
            .SetPreflightMaxAge(System.TimeSpan.FromMinutes(10));
    });
});

// -- JSON
builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
    options.SerializerOptions.NumberHandling = JsonNumberHandling.Strict;
});

// -- Request size limit
builder.WebHost.ConfigureKestrel(options =>
{
    options.Limits.MaxRequestBodySize = 10 * 1024 * 1024; // 10MB
});

builder.Services.AddOpenApi();

var app = builder.Build();

// -- Security headers
app.Use(async (context, next) =>
{
    var headers = context.Response.Headers;
    headers["X-Content-Type-Options"] = "nosniff";
    headers["X-Frame-Options"] = "DENY";
    headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
    headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()";
    headers["Content-Security-Policy"] =
        "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; " +
        "img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; " +
        "frame-ancestors 'none'; base-uri 'self'; form-action 'self';";

    if (!context.Request.IsHttps)
    {
        headers["Strict-Transport-Security"] =
            "max-age=31536000; includeSubDomains; preload";
    }

    await next();
});

// -- Pipeline
app.UseHttpsRedirection();
app.UseHsts();
app.UseCors();
app.UseAuthentication();
app.UseAuthorization();
app.UseRateLimiter();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.Services.ApplyMigrationsAndSeed();

// -- Auth endpoints (unauthenticated, rate-limited)
app.MapGroup("/api/auth").AllowAnonymous().RequireRateLimiting("AuthPolicy");
app.MapAuthEndpoints();

// -- Protected endpoints
app.MapGroup("/api/businesses").RequireAuthorization("OwnerOnly");
app.MapBusinessEndpoints();

app.MapGroup("/api/vehicles").RequireAuthorization("StaffOrAbove");
app.MapFleetEndpoints();

app.MapGroup("/api/customers").RequireAuthorization("StaffOrAbove");
app.MapCustomerEndpoints();

app.MapGroup("/api/staff").RequireAuthorization("OwnerOnly");
app.MapStaffEndpoints();

app.MapGroup("/api/inquiries").RequireAuthorization("StaffOrAbove");
app.MapGroup("/api/reservations").RequireAuthorization("StaffOrAbove");
app.MapGroup("/api/rentals").RequireAuthorization("StaffOrAbove");
app.MapReservationEndpoints();

app.MapGroup("/api/payments").RequireAuthorization("ManagerOrAbove");
app.MapPaymentEndpoints();

app.MapGroup("/api/inspections").RequireAuthorization("StaffOrAbove");
app.MapInspectionEndpoints();

app.MapGroup("/api/timeline").RequireAuthorization("StaffOrAbove");
app.MapTimelineEndpoints();

app.MapGroup("/api/attachments").RequireAuthorization("StaffOrAbove");
app.MapAttachmentEndpoints();

app.MapGroup("/api/operations").RequireAuthorization("StaffOrAbove");
app.MapOperationsEndpoints();

app.MapGroup("/api").RequireRateLimiting("GlobalPolicy");

app.Run();
```

---

## Appendix A: Review Methodology

This review was conducted by:
1. **Code review** — All C# source files in `backend/src/`, all TypeScript files in `frontend/src/`
2. **Architecture review** — `Program.cs` pipeline, `RentalinDbContext`, domain entities, endpoint handlers
3. **Configuration review** — `appsettings.json`, `next.config.ts`, `package.json`, `Rentalin.Api.csproj`
4. **Threat modeling** — STRIDE analysis applied to four threat actors and six components
5. **Compliance mapping** — UU PDP requirements mapped to implementation gaps

## Appendix B: Tool References

| Tool | Purpose | URL |
|------|---------|-----|
| OWASP ZAP | Dynamic application security testing | https://www.zaproxy.org |
| SQLCipher | SQLite encryption | https://www.zetetic.net/sqlcipher |
| Security Headers | Header compliance checker | https://securityheaders.com |
| SSL Labs | TLS configuration analyzer | https://www.ssllabs.com/ssltest |
| Snyk / Dependabot | Dependency vulnerability scanning | https://snyk.io |

---

*This document must be reviewed and updated at minimum every 6 months, or after any significant architectural change. All findings are based on code review dated 2026-07-30.*
