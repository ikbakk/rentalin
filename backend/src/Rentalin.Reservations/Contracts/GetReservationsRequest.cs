using MediatR;

namespace Rentalin.Reservations.Contracts;

public sealed record GetReservationsRequest : IRequest<IReadOnlyList<ReservationResponse>>;
