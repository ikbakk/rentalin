using MediatR;

namespace Rentalin.Reservations.Contracts;

public sealed record ExtendRentalRequest(
    Guid RentalId,
    DateTimeOffset NewEnd,
    decimal AdditionalAmount,
    string Currency) : IRequest<RentalResponse>;
