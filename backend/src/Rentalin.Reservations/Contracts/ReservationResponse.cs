namespace Rentalin.Reservations.Contracts;

public sealed record ReservationResponse(
    Guid Id,
    Guid InquiryId,
    Guid CustomerId,
    Guid VehicleId,
    DateTimeOffset StartDate,
    DateTimeOffset EndDate,
    decimal EstimatedCost,
    string Currency,
    string Status);
