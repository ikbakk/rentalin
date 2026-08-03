using MediatR;

namespace Rentalin.Fleet.Contracts;

public sealed record UpdateVehicleRequest(
    Guid VehicleId,
    string LicensePlate,
    string Make,
    string Model,
    int Year,
    string Color,
    int SeatingCapacity,
    decimal DailyRate,
    string Currency,
    Guid BusinessId) : IRequest<VehicleResponse>;
