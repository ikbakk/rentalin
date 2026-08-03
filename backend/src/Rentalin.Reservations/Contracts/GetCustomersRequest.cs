using MediatR;

namespace Rentalin.Reservations.Contracts;

public sealed record GetCustomersRequest : IRequest<IReadOnlyList<CustomerResponse>>;
