using MediatR;
using Rentalin.Core.Interfaces;
using Rentalin.Fleet.Domain.Entities;
using Rentalin.Fleet.Domain.Enums;
using Rentalin.Inspections.Domain.Documents;
using Rentalin.Timeline.Domain.Entities;

namespace Rentalin.Inspections.Domain.Documents.Handlers;

public sealed class InspectionCompletedDomainHandler : INotificationHandler<InspectionCompleted>
{
    private readonly IRepository<Vehicle> _vehicles;
    private readonly IRepository<TimelineEntry> _timelineEntries;
    private readonly IUnitOfWork _unitOfWork;

    public InspectionCompletedDomainHandler(
        IRepository<Vehicle> vehicles,
        IRepository<TimelineEntry> timelineEntries,
        IUnitOfWork unitOfWork)
    {
        _vehicles = vehicles;
        _timelineEntries = timelineEntries;
        _unitOfWork = unitOfWork;
    }

    public async Task Handle(InspectionCompleted notification, CancellationToken ct)
    {
        var vehicle = await _vehicles.GetByIdAsync(notification.VehicleId, ct);
        if (vehicle is not null)
        {
            vehicle.UpdateStatus(VehicleStatus.Available);
            _vehicles.Update(vehicle);
        }

        var entry = TimelineEntry.Create(
            "Inspection", notification.InspectionId, "InspectionCompleted",
            $"Inspection {notification.InspectionId} was completed.", "System");
        _timelineEntries.Add(entry);
        await _unitOfWork.SaveChangesAsync(ct);
    }
}
