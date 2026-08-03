using MediatR;

namespace Rentalin.Reservations.Contracts;

public sealed record GetInquiriesRequest : IRequest<IReadOnlyList<InquiryResponse>>;
