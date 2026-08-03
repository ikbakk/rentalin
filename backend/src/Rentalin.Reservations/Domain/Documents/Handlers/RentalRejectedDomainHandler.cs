using MediatR;
using Rentalin.Core.Interfaces;
using Rentalin.Fleet.Domain.Entities;
using Rentalin.Fleet.Domain.Enums;
using Rentalin.Reservations.Domain.Documents;
using Rentalin.Timeline.Domain.Entities;

namespace Rentalin.Reservations.Domain.Documents.Handlers;

public sealed class RentalRejectedDomainHandler : INotificationHandler<RentalRejected>
{
    private readonly IRepository<Vehicle> _vehicles;
    private readonly IRepository<TimelineEntry> _timelineEntries;
    private readonly IUnitOfWork _unitOfWork;
    private readonly INotificationService _notificationService;

    public RentalRejectedDomainHandler(
        IRepository<Vehicle> vehicles,
        IRepository<TimelineEntry> timelineEntries,
        IUnitOfWork unitOfWork,
        INotificationService notificationService)
    {
        _vehicles = vehicles;
        _timelineEntries = timelineEntries;
        _unitOfWork = unitOfWork;
        _notificationService = notificationService;
    }

    public async Task Handle(RentalRejected notification, CancellationToken ct)
    {
        var vehicle = await _vehicles.GetByIdAsync(notification.VehicleId, ct);
        if (vehicle is not null)
        {
            vehicle.UpdateStatus(VehicleStatus.Available);
            _vehicles.Update(vehicle);
        }

        var entry = TimelineEntry.Create(
            "Rental", notification.RentalId, "RentalRejected",
            $"Rental {notification.RentalId} rejected. Reason: {notification.Reason}", "System");
        _timelineEntries.Add(entry);

        await _notificationService.SendAsync(
            "admin@rentalin.id",
            "Rental Rejected",
            $"Rental {notification.RentalId} was rejected. Reason: {notification.Reason}",
            ct);

        await _unitOfWork.SaveChangesAsync(ct);
    }
}
