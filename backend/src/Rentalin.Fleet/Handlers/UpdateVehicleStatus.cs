using MediatR;
using Rentalin.Core.Interfaces;
using Rentalin.Fleet.Contracts;
using Rentalin.Fleet.Domain.Entities;
using Rentalin.Fleet.Domain.Enums;

namespace Rentalin.Fleet.Handlers;

public sealed class UpdateVehicleStatusHandler : IRequestHandler<UpdateVehicleStatusRequest, VehicleResponse>
{
    private readonly IRepository<Vehicle> _vehicles;
    private readonly IUnitOfWork _unitOfWork;

    public UpdateVehicleStatusHandler(IRepository<Vehicle> vehicles, IUnitOfWork unitOfWork)
    {
        _vehicles = vehicles;
        _unitOfWork = unitOfWork;
    }

    public async Task<VehicleResponse> Handle(UpdateVehicleStatusRequest request, CancellationToken ct)
    {
        var vehicle = await _vehicles.GetByIdAsync(request.VehicleId, ct)
            ?? throw new InvalidOperationException($"Vehicle {request.VehicleId} not found.");

        var status = Enum.Parse<VehicleStatus>(request.Status);
        vehicle.UpdateStatus(status);

        _vehicles.Update(vehicle);
        await _unitOfWork.SaveChangesAsync(ct);

        return new VehicleResponse(
            vehicle.Id, vehicle.LicensePlate, vehicle.Make, vehicle.Model,
            vehicle.Year, vehicle.Color, vehicle.SeatingCapacity,
            vehicle.DailyRate.Amount, vehicle.DailyRate.Currency,
            vehicle.Status.ToString(), vehicle.BusinessId);
    }
}
