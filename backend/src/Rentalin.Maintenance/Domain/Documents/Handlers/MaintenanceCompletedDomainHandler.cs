using MediatR;
using Rentalin.Core.Interfaces;
using Rentalin.Fleet.Domain.Entities;
using Rentalin.Fleet.Domain.Enums;
using Rentalin.Maintenance.Domain.Documents;
using Rentalin.Timeline.Domain.Entities;

namespace Rentalin.Maintenance.Domain.Documents.Handlers;

public sealed class MaintenanceCompletedDomainHandler : INotificationHandler<MaintenanceCompleted>
{
    private readonly IRepository<Vehicle> _vehicles;
    private readonly IRepository<TimelineEntry> _timelineEntries;
    private readonly IUnitOfWork _unitOfWork;

    public MaintenanceCompletedDomainHandler(
        IRepository<Vehicle> vehicles,
        IRepository<TimelineEntry> timelineEntries,
        IUnitOfWork unitOfWork)
    {
        _vehicles = vehicles;
        _timelineEntries = timelineEntries;
        _unitOfWork = unitOfWork;
    }

    public async Task Handle(MaintenanceCompleted notification, CancellationToken ct)
    {
        var vehicle = await _vehicles.GetByIdAsync(notification.VehicleId, ct);
        if (vehicle is not null)
        {
            vehicle.UpdateStatus(VehicleStatus.Available);
            _vehicles.Update(vehicle);
        }

        var entry = TimelineEntry.Create(
            "Maintenance", notification.MaintenanceId, "MaintenanceCompleted",
            $"Maintenance {notification.MaintenanceId} completed. Vehicle is now available.", "System");
        _timelineEntries.Add(entry);
        await _unitOfWork.SaveChangesAsync(ct);
    }
}
