using MediatR;

namespace Rentalin.Fleet.Contracts;

public sealed record UpdateVehicleStatusRequest(Guid VehicleId, string Status) : IRequest<VehicleResponse>;
