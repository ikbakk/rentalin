using MediatR;

namespace Rentalin.Reservations.Contracts;

public sealed record PrepareReservationRequest(Guid ReservationId) : IRequest<ReservationResponse>;
