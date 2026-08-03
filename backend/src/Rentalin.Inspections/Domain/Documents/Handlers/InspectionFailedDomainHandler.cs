using MediatR;
using Rentalin.Core.Interfaces;
using Rentalin.Fleet.Domain.Entities;
using Rentalin.Fleet.Domain.Enums;
using Rentalin.Inspections.Domain.Documents;
using Rentalin.Timeline.Domain.Entities;

namespace Rentalin.Inspections.Domain.Documents.Handlers;

public sealed class InspectionFailedDomainHandler : INotificationHandler<InspectionFailed>
{
    private readonly IRepository<Vehicle> _vehicles;
    private readonly IRepository<TimelineEntry> _timelineEntries;
    private readonly IUnitOfWork _unitOfWork;

    public InspectionFailedDomainHandler(
        IRepository<Vehicle> vehicles,
        IRepository<TimelineEntry> timelineEntries,
        IUnitOfWork unitOfWork)
    {
        _vehicles = vehicles;
        _timelineEntries = timelineEntries;
        _unitOfWork = unitOfWork;
    }

    public async Task Handle(InspectionFailed notification, CancellationToken ct)
    {
        var vehicle = await _vehicles.GetByIdAsync(notification.VehicleId, ct);
        if (vehicle is not null)
        {
            vehicle.UpdateStatus(VehicleStatus.Maintenance);
            _vehicles.Update(vehicle);
        }

        var entry = TimelineEntry.Create(
            "Inspection", notification.InspectionId, "InspectionFailed",
            $"Inspection {notification.InspectionId} failed. Reason: {notification.Reason}", "System");
        _timelineEntries.Add(entry);
        await _unitOfWork.SaveChangesAsync(ct);
    }
}
