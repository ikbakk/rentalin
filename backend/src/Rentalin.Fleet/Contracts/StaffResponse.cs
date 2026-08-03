namespace Rentalin.Fleet.Contracts;

public sealed record StaffResponse(
    Guid Id,
    string Name,
    string Email,
    string PhoneNumber,
    string Role,
    Guid BusinessId,
    bool IsActive);
