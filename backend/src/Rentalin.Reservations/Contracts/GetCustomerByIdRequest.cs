using MediatR;

namespace Rentalin.Reservations.Contracts;

public sealed record GetCustomerByIdRequest(Guid Id) : IRequest<CustomerResponse>;
