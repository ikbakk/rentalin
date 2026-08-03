using Microsoft.EntityFrameworkCore;
using Rentalin.Core.Entities;
using Rentalin.Infrastructure.Data;

namespace Rentalin.Api.Endpoints;

public static class UploadEndpoints
{
    public static void MapUploadEndpoints(this WebApplication app)
    {
        var uploadsPath = Path.Combine(app.Environment.ContentRootPath, "uploads");

        app.MapPost("/api/uploads", async (HttpRequest request, RentalinDbContext db, CancellationToken ct) =>
        {
            if (!request.HasFormContentType)
                return Results.BadRequest(new { error = "Multipart form data required" });

            var form = await request.ReadFormAsync(ct);
            var file = form.Files.GetFile("file");
            if (file is null || file.Length == 0)
                return Results.BadRequest(new { error = "File is required" });

            if (file.Length > 10 * 1024 * 1024)
                return Results.BadRequest(new { error = "File too large. Max 10MB." });

            var allowedTypes = new[] { "image/jpeg", "image/png", "image/webp", "application/pdf" };
            if (!allowedTypes.Contains(file.ContentType.ToLower()))
                return Results.BadRequest(new { error = "Invalid file type" });

            var fileName = $"{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";
            var filePath = Path.Combine(uploadsPath, fileName);

            await using var stream = File.Create(filePath);
            await file.CopyToAsync(stream, ct);

            var referenceType = form["referenceType"].FirstOrDefault() ?? "General";
            var referenceId = form["referenceId"].FirstOrDefault();
            if (string.IsNullOrEmpty(referenceId))
                referenceId = Guid.NewGuid().ToString();

            var attachment = Attachment.Create(
                referenceType,
                Guid.Parse(referenceId),
                file.FileName,
                file.ContentType,
                $"/uploads/{fileName}",
                file.Length);

            db.Attachments.Add(attachment);
            await db.SaveChangesAsync(ct);

            return Results.Ok(new
            {
                id = attachment.Id,
                fileName = attachment.FileName,
                contentType = attachment.ContentType,
                url = attachment.FileUrl,
                sizeBytes = attachment.FileSizeBytes
            });
        }).DisableAntiforgery().RequireAuthorization();

        app.MapGet("/api/uploads", async (string? referenceType, Guid? referenceId, RentalinDbContext db, CancellationToken ct) =>
        {
            var query = db.Attachments.AsNoTracking().AsQueryable();
            if (!string.IsNullOrEmpty(referenceType))
                query = query.Where(a => a.ReferenceType == referenceType);
            if (referenceId.HasValue)
                query = query.Where(a => a.ReferenceId == referenceId.Value);

            var attachments = await query.OrderByDescending(a => a.UploadedAt).ToListAsync(ct);
            return Results.Ok(attachments.Select(a => new
            {
                a.Id,
                a.FileName,
                a.ContentType,
                Url = a.FileUrl,
                a.FileSizeBytes,
                a.UploadedAt
            }));
        }).RequireAuthorization();
    }
}
