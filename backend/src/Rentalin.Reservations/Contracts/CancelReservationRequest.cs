using MediatR;

namespace Rentalin.Reservations.Contracts;

public sealed record CancelReservationRequest(Guid ReservationId, string? Reason = null) : IRequest<ReservationResponse>;
