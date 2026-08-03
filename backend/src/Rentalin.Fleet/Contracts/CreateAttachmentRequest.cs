using MediatR;

namespace Rentalin.Fleet.Contracts;

public sealed record CreateAttachmentRequest(
    string ReferenceType,
    Guid ReferenceId,
    string FileName,
    string ContentType,
    string FileUrl,
    long FileSizeBytes) : IRequest<AttachmentResponse>;
