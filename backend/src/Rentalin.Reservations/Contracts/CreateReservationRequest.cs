using MediatR;

namespace Rentalin.Reservations.Contracts;

public sealed record CreateReservationRequest(Guid InquiryId, decimal EstimatedCost, string Currency) : IRequest<ReservationResponse>;
