namespace Rentalin.Reservations.Contracts;

public sealed record InquiryResponse(
    Guid Id,
    Guid CustomerId,
    string CustomerName,
    Guid VehicleId,
    string VehicleSummary,
    DateTimeOffset StartDate,
    DateTimeOffset EndDate,
    string Status,
    string? Notes);
