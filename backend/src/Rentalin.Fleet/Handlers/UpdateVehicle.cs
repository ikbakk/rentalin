using MediatR;
using Rentalin.Core.Interfaces;
using Rentalin.Core.ValueObjects;
using Rentalin.Fleet.Contracts;
using Rentalin.Fleet.Domain.Entities;

namespace Rentalin.Fleet.Handlers;

public sealed class UpdateVehicleHandler : IRequestHandler<UpdateVehicleRequest, VehicleResponse>
{
    private readonly IRepository<Vehicle> _vehicles;
    private readonly IUnitOfWork _unitOfWork;

    public UpdateVehicleHandler(IRepository<Vehicle> vehicles, IUnitOfWork unitOfWork)
    {
        _vehicles = vehicles;
        _unitOfWork = unitOfWork;
    }

    public async Task<VehicleResponse> Handle(UpdateVehicleRequest request, CancellationToken ct)
    {
        var vehicle = await _vehicles.GetByIdAsync(request.VehicleId, ct)
            ?? throw new InvalidOperationException($"Vehicle {request.VehicleId} not found.");

        var dailyRate = new Money(request.DailyRate, request.Currency);
        vehicle.Update(request.LicensePlate, request.Make, request.Model,
            request.Year, request.Color, request.SeatingCapacity,
            dailyRate, request.BusinessId);

        _vehicles.Update(vehicle);
        await _unitOfWork.SaveChangesAsync(ct);

        return new VehicleResponse(
            vehicle.Id, vehicle.LicensePlate, vehicle.Make, vehicle.Model,
            vehicle.Year, vehicle.Color, vehicle.SeatingCapacity,
            vehicle.DailyRate.Amount, vehicle.DailyRate.Currency,
            vehicle.Status.ToString(), vehicle.BusinessId);
    }
}
