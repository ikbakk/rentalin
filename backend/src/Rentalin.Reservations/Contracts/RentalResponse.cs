namespace Rentalin.Reservations.Contracts;

public sealed record RentalResponse(
    Guid Id,
    Guid ReservationId,
    Guid VehicleId,
    Guid CustomerId,
    DateTimeOffset? ActualStart,
    DateTimeOffset? ActualEnd,
    int? OdometerStart,
    int? OdometerEnd,
    string Status);
