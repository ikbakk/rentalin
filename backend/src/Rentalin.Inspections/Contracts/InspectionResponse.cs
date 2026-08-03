namespace Rentalin.Inspections.Contracts;

public sealed record InspectionResponse(
    Guid Id,
    Guid VehicleId,
    Guid RentalId,
    string Type,
    string Status,
    List<string> PhotoUrls,
    string Notes);
