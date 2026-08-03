using MediatR;

namespace Rentalin.Reservations.Contracts;

public sealed record UpdateCustomerRequest(
    Guid Id,
    string Name,
    string PhoneNumber,
    string Email,
    string? Notes) : IRequest<CustomerResponse>;
