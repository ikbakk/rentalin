using MediatR;
using Rentalin.Core.Interfaces;
using Rentalin.Maintenance.Contracts;
using Rentalin.Maintenance.Domain.Entities;

namespace Rentalin.Maintenance.Handlers;

public sealed class StartMaintenanceHandler : IRequestHandler<StartMaintenanceRequest, MaintenanceRecordResponse>
{
    private readonly IRepository<MaintenanceRecord> _maintenanceRecords;
    private readonly IUnitOfWork _unitOfWork;

    public StartMaintenanceHandler(IRepository<MaintenanceRecord> maintenanceRecords, IUnitOfWork unitOfWork)
    {
        _maintenanceRecords = maintenanceRecords;
        _unitOfWork = unitOfWork;
    }

    public async Task<MaintenanceRecordResponse> Handle(StartMaintenanceRequest request, CancellationToken ct)
    {
        var record = await _maintenanceRecords.GetByIdAsync(request.MaintenanceId, ct)
            ?? throw new InvalidOperationException($"Maintenance record {request.MaintenanceId} not found.");

        record.Start();
        _maintenanceRecords.Update(record);
        await _unitOfWork.SaveChangesAsync(ct);

        return new MaintenanceRecordResponse(
            record.Id, record.VehicleId, record.Type.ToString(), record.Description,
            record.Status.ToString(), record.ScheduledStart,
            record.ActualStart, record.ActualEnd,
            record.Cost.Amount, record.Cost.Currency,
            record.Workshop, record.Notes, record.PhotoUrls);
    }
}

public sealed record StartMaintenanceRequest(Guid MaintenanceId) : IRequest<MaintenanceRecordResponse>;
