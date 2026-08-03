using MediatR;

namespace Rentalin.Reservations.Contracts;

public sealed record ConfirmInquiryRequest(Guid InquiryId) : IRequest<InquiryResponse>;
