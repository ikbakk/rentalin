using MediatR;

namespace Rentalin.Reservations.Contracts;

public sealed record GetReservationByIdRequest(Guid Id) : IRequest<ReservationResponse>;
