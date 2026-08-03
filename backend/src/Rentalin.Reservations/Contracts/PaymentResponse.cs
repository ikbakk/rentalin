namespace Rentalin.Reservations.Contracts;

public sealed record PaymentResponse(
    Guid Id,
    Guid RentalId,
    decimal Amount,
    string Currency,
    string Method,
    string Status,
    DateTimeOffset? PaidAt);
