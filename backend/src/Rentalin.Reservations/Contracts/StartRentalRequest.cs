using MediatR;

namespace Rentalin.Reservations.Contracts;

public sealed record StartRentalRequest(Guid ReservationId, int OdometerStart) : IRequest<RentalResponse>;
