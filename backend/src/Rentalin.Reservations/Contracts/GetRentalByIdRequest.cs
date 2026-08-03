using MediatR;

namespace Rentalin.Reservations.Contracts;

public sealed record GetRentalByIdRequest(Guid Id) : IRequest<RentalResponse>;
