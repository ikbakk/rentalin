namespace Rentalin.Fleet.Contracts;

public sealed record VehicleResponse(
    Guid Id,
    string LicensePlate,
    string Make,
    string Model,
    int Year,
    string Color,
    int SeatingCapacity,
    decimal DailyRateAmount,
    string DailyRateCurrency,
    string Status,
    Guid BusinessId);
