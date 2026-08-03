using MediatR;

namespace Rentalin.Reservations.Contracts;

public sealed record HandoverCompleteRequest(Guid ReservationId) : IRequest<ReservationResponse>;
