using MediatR;

namespace Rentalin.Reservations.Contracts;

public sealed record CancelInquiryRequest(Guid InquiryId, string? Reason = null) : IRequest<InquiryResponse>;
