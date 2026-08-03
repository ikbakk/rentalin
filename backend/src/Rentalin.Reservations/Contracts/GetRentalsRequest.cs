using MediatR;

namespace Rentalin.Reservations.Contracts;

public sealed record GetRentalsRequest : IRequest<IReadOnlyList<RentalResponse>>;
