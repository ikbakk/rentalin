namespace Rentalin.Reservations.Contracts;

public sealed record CustomerResponse(
    Guid Id,
    string Name,
    string PhoneNumber,
    string Email,
    string? Notes);
