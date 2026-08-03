using MediatR;
using Rentalin.Core.Interfaces;
using Rentalin.Fleet.Contracts;
using Rentalin.Fleet.Domain.Entities;

namespace Rentalin.Fleet.Handlers;

public sealed class GetVehicleByIdHandler : IRequestHandler<GetVehicleByIdRequest, VehicleResponse>
{
    private readonly IRepository<Vehicle> _vehicles;

    public GetVehicleByIdHandler(IRepository<Vehicle> vehicles)
    {
        _vehicles = vehicles;
    }

    public async Task<VehicleResponse> Handle(GetVehicleByIdRequest request, CancellationToken ct)
    {
        var vehicle = await _vehicles.GetByIdAsync(request.Id, ct)
            ?? throw new InvalidOperationException($"Vehicle {request.Id} not found.");

        return new VehicleResponse(
            vehicle.Id, vehicle.LicensePlate, vehicle.Make, vehicle.Model,
            vehicle.Year, vehicle.Color, vehicle.SeatingCapacity,
            vehicle.DailyRate.Amount, vehicle.DailyRate.Currency,
            vehicle.Status.ToString(), vehicle.BusinessId);
    }
}

public sealed record GetVehicleByIdRequest(Guid Id) : IRequest<VehicleResponse>;
