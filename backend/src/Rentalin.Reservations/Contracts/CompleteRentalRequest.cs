using MediatR;

namespace Rentalin.Reservations.Contracts;

public sealed record CompleteRentalRequest(Guid RentalId, int OdometerEnd) : IRequest<RentalResponse>;
