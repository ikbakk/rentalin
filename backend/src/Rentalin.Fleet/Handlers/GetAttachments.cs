using MediatR;
using Rentalin.Core.Entities;
using Rentalin.Core.Interfaces;
using Rentalin.Fleet.Contracts;

namespace Rentalin.Fleet.Handlers;

public sealed class GetAttachmentsHandler : IRequestHandler<GetAttachmentsRequest, IReadOnlyList<AttachmentResponse>>
{
    private readonly IRepository<Attachment> _attachments;

    public GetAttachmentsHandler(IRepository<Attachment> attachments)
    {
        _attachments = attachments;
    }

    public async Task<IReadOnlyList<AttachmentResponse>> Handle(GetAttachmentsRequest request, CancellationToken ct)
    {
        var attachments = await _attachments.GetAllAsync(ct);
        return attachments
            .Where(a => a.ReferenceType == request.ReferenceType && a.ReferenceId == request.ReferenceId)
            .Select(a => new AttachmentResponse(a.Id, a.ReferenceType, a.ReferenceId,
                a.FileName, a.ContentType, a.FileUrl, a.FileSizeBytes, a.UploadedAt))
            .ToList();
    }
}
