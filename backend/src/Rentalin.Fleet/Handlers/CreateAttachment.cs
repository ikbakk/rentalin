using MediatR;
using Rentalin.Core.Entities;
using Rentalin.Core.Interfaces;
using Rentalin.Fleet.Contracts;

namespace Rentalin.Fleet.Handlers;

public sealed class CreateAttachmentHandler : IRequestHandler<CreateAttachmentRequest, AttachmentResponse>
{
    private readonly IRepository<Attachment> _attachments;
    private readonly IUnitOfWork _unitOfWork;

    public CreateAttachmentHandler(IRepository<Attachment> attachments, IUnitOfWork unitOfWork)
    {
        _attachments = attachments;
        _unitOfWork = unitOfWork;
    }

    public async Task<AttachmentResponse> Handle(CreateAttachmentRequest request, CancellationToken ct)
    {
        var attachment = Attachment.Create(
            request.ReferenceType, request.ReferenceId,
            request.FileName, request.ContentType,
            request.FileUrl, request.FileSizeBytes);

        _attachments.Add(attachment);
        await _unitOfWork.SaveChangesAsync(ct);

        return new AttachmentResponse(attachment.Id, attachment.ReferenceType, attachment.ReferenceId,
            attachment.FileName, attachment.ContentType, attachment.FileUrl,
            attachment.FileSizeBytes, attachment.UploadedAt);
    }
}
