using MediatR;

namespace Rentalin.Fleet.Contracts;

public sealed record AttachmentResponse(
    Guid Id,
    string ReferenceType,
    Guid ReferenceId,
    string FileName,
    string ContentType,
    string FileUrl,
    long FileSizeBytes,
    DateTimeOffset UploadedAt);
