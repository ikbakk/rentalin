using MediatR;

namespace Rentalin.Fleet.Contracts;

public sealed record GetAttachmentsRequest(string ReferenceType, Guid ReferenceId) : IRequest<IReadOnlyList<AttachmentResponse>>;
