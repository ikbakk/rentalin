namespace Rentalin.Fleet.Contracts;

public sealed record BusinessResponse(
    Guid Id,
    string Name,
    string Address,
    string PhoneNumber,
    string Email,
    string? LogoUrl,
    string Slug);
