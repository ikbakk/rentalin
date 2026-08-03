namespace Rentalin.Api.Contracts;

public sealed record FleetStatusItem(Guid VehicleId, string LicensePlate, string Status);

public sealed record FleetStatusResponse(IReadOnlyList<FleetStatusItem> Vehicles);
