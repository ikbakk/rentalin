using MediatR;

namespace Rentalin.Reservations.Contracts;

public sealed record ReadyForHandoverRequest(Guid ReservationId) : IRequest<ReservationResponse>;
