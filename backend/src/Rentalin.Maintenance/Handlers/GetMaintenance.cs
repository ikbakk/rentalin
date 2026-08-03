using MediatR;
using Rentalin.Core.Interfaces;
using Rentalin.Maintenance.Contracts;
using Rentalin.Maintenance.Domain.Entities;

namespace Rentalin.Maintenance.Handlers;

public sealed class GetMaintenanceHandler : IRequestHandler<GetMaintenanceRequest, IReadOnlyList<MaintenanceRecordResponse>>
{
    private readonly IRepository<MaintenanceRecord> _maintenanceRecords;

    public GetMaintenanceHandler(IRepository<MaintenanceRecord> maintenanceRecords)
    {
        _maintenanceRecords = maintenanceRecords;
    }

    public async Task<IReadOnlyList<MaintenanceRecordResponse>> Handle(GetMaintenanceRequest request, CancellationToken ct)
    {
        var records = await _maintenanceRecords.GetAllAsync(ct);

        if (request.VehicleId.HasValue)
            records = records.Where(r => r.VehicleId == request.VehicleId.Value).ToList();

        return records.Select(r => new MaintenanceRecordResponse(
            r.Id, r.VehicleId, r.Type.ToString(), r.Description,
            r.Status.ToString(), r.ScheduledStart,
            r.ActualStart, r.ActualEnd,
            r.Cost.Amount, r.Cost.Currency,
            r.Workshop, r.Notes, r.PhotoUrls)).ToList();
    }
}

public sealed record GetMaintenanceRequest(Guid? VehicleId = null) : IRequest<IReadOnlyList<MaintenanceRecordResponse>>;
