using MediatR;

namespace Rentalin.Reservations.Contracts;

public sealed record GetInquiryByIdRequest(Guid Id) : IRequest<InquiryResponse>;
