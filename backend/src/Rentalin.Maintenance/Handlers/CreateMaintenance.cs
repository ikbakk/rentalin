using MediatR;
using Rentalin.Core.Interfaces;
using Rentalin.Core.ValueObjects;
using Rentalin.Maintenance.Contracts;
using Rentalin.Maintenance.Domain.Entities;
using Rentalin.Maintenance.Domain.Enums;

namespace Rentalin.Maintenance.Handlers;

public sealed class CreateMaintenanceHandler : IRequestHandler<CreateMaintenanceRequest, MaintenanceRecordResponse>
{
    private readonly IRepository<MaintenanceRecord> _maintenanceRecords;
    private readonly IUnitOfWork _unitOfWork;

    public CreateMaintenanceHandler(IRepository<MaintenanceRecord> maintenanceRecords, IUnitOfWork unitOfWork)
    {
        _maintenanceRecords = maintenanceRecords;
        _unitOfWork = unitOfWork;
    }

    public async Task<MaintenanceRecordResponse> Handle(CreateMaintenanceRequest request, CancellationToken ct)
    {
        var record = MaintenanceRecord.Create(
            request.VehicleId,
            Enum.Parse<MaintenanceType>(request.Type),
            request.Description,
            request.ScheduledStart,
            new Money(request.CostAmount, request.CostCurrency),
            request.Workshop,
            request.Notes);

        _maintenanceRecords.Add(record);
        await _unitOfWork.SaveChangesAsync(ct);

        return new MaintenanceRecordResponse(
            record.Id, record.VehicleId, record.Type.ToString(), record.Description,
            record.Status.ToString(), record.ScheduledStart,
            record.ActualStart, record.ActualEnd,
            record.Cost.Amount, record.Cost.Currency,
            record.Workshop, record.Notes, record.PhotoUrls);
    }
}

public sealed record CreateMaintenanceRequest(
    Guid VehicleId,
    string Type,
    string Description,
    DateTimeOffset ScheduledStart,
    decimal CostAmount,
    string CostCurrency,
    string? Workshop,
    string? Notes) : IRequest<MaintenanceRecordResponse>;
