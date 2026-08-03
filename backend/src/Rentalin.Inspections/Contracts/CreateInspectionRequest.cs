using MediatR;

namespace Rentalin.Inspections.Contracts;

public sealed record CreateInspectionRequest(
    Guid VehicleId,
    Guid RentalId,
    string InspectionType,
    List<string> PhotoUrls,
    string Notes) : IRequest<InspectionResponse>;
