using MediatR;
using Rentalin.Core.Interfaces;
using Rentalin.Fleet.Contracts;
using Rentalin.Fleet.Domain.Entities;

namespace Rentalin.Fleet.Handlers;

public sealed class GetVehiclesHandler : IRequestHandler<GetVehiclesRequest, IReadOnlyList<VehicleResponse>>
{
    private readonly IRepository<Vehicle> _vehicles;

    public GetVehiclesHandler(IRepository<Vehicle> vehicles)
    {
        _vehicles = vehicles;
    }

    public async Task<IReadOnlyList<VehicleResponse>> Handle(GetVehiclesRequest request, CancellationToken ct)
    {
        var vehicles = await _vehicles.GetAllAsync(ct);
        return vehicles.Select(v => new VehicleResponse(
            v.Id, v.LicensePlate, v.Make, v.Model,
            v.Year, v.Color, v.SeatingCapacity,
            v.DailyRate.Amount, v.DailyRate.Currency,
            v.Status.ToString(), v.BusinessId)).ToList();
    }
}

public sealed record GetVehiclesRequest : IRequest<IReadOnlyList<VehicleResponse>>;
