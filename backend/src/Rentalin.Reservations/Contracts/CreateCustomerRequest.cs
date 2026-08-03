using MediatR;

namespace Rentalin.Reservations.Contracts;

public sealed record CreateCustomerRequest(
    string Name,
    string PhoneNumber,
    string Email,
    string? Notes) : IRequest<CustomerResponse>;
