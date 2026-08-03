using MediatR;
using Rentalin.Core.Interfaces;
using Rentalin.Fleet.Domain.Entities;
using Rentalin.Fleet.Domain.Enums;
using Rentalin.Reservations.Domain.Documents;
using Rentalin.Timeline.Domain.Entities;

namespace Rentalin.Reservations.Domain.Documents.Handlers;

public sealed class RentalStartedDomainHandler : INotificationHandler<RentalStarted>
{
    private readonly IRepository<Vehicle> _vehicles;
    private readonly IRepository<TimelineEntry> _timelineEntries;
    private readonly IUnitOfWork _unitOfWork;

    public RentalStartedDomainHandler(
        IRepository<Vehicle> vehicles,
        IRepository<TimelineEntry> timelineEntries,
        IUnitOfWork unitOfWork)
    {
        _vehicles = vehicles;
        _timelineEntries = timelineEntries;
        _unitOfWork = unitOfWork;
    }

    public async Task Handle(RentalStarted notification, CancellationToken ct)
    {
        var vehicle = await _vehicles.GetByIdAsync(notification.VehicleId, ct);
        if (vehicle is not null)
        {
            vehicle.UpdateStatus(VehicleStatus.Rented);
            _vehicles.Update(vehicle);
        }

        var entry = TimelineEntry.Create(
            "Rental", notification.RentalId, "RentalStarted",
            $"Rental {notification.RentalId} started with odometer {notification.OdometerStart}.", "System");
        _timelineEntries.Add(entry);
        await _unitOfWork.SaveChangesAsync(ct);
    }
}
