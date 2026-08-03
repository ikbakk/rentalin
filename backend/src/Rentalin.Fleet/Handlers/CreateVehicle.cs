using MediatR;
using Rentalin.Core.Interfaces;
using Rentalin.Core.ValueObjects;
using Rentalin.Fleet.Contracts;
using Rentalin.Fleet.Domain.Entities;
using Rentalin.Fleet.Domain.Enums;

namespace Rentalin.Fleet.Handlers;

public sealed class CreateVehicleHandler : IRequestHandler<CreateVehicleRequest, VehicleResponse>
{
    private readonly IRepository<Vehicle> _vehicles;
    private readonly IUnitOfWork _unitOfWork;

    public CreateVehicleHandler(IRepository<Vehicle> vehicles, IUnitOfWork unitOfWork)
    {
        _vehicles = vehicles;
        _unitOfWork = unitOfWork;
    }

    public async Task<VehicleResponse> Handle(CreateVehicleRequest request, CancellationToken ct)
    {
        var dailyRate = new Money(request.DailyRate, request.Currency);
        var vehicle = Vehicle.Create(
            request.LicensePlate, request.Make, request.Model,
            request.Year, request.Color, request.SeatingCapacity,
            dailyRate, request.BusinessId);

        _vehicles.Add(vehicle);
        await _unitOfWork.SaveChangesAsync(ct);

        return MapToResponse(vehicle);
    }

    private static VehicleResponse MapToResponse(Vehicle vehicle)
    {
        return new VehicleResponse(
            vehicle.Id, vehicle.LicensePlate, vehicle.Make, vehicle.Model,
            vehicle.Year, vehicle.Color, vehicle.SeatingCapacity,
            vehicle.DailyRate.Amount, vehicle.DailyRate.Currency,
            vehicle.Status.ToString(), vehicle.BusinessId);
    }
}
