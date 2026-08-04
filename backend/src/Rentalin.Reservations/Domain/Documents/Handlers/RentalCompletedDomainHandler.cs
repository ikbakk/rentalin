using MediatR;
using Rentalin.Core.Interfaces;
using Rentalin.Fleet.Domain.Entities;
using Rentalin.Fleet.Domain.Enums;
using Rentalin.Inspections.Domain.Entities;
using Rentalin.Inspections.Domain.Enums;
using Rentalin.Reservations.Domain.Documents;
using Rentalin.Timeline.Domain.Entities;

namespace Rentalin.Reservations.Domain.Documents.Handlers;

public sealed class RentalCompletedDomainHandler : INotificationHandler<RentalCompleted>
{
    private readonly IRepository<Vehicle> _vehicles;
    private readonly IRepository<Inspection> _inspections;
    private readonly IRepository<TimelineEntry> _timelineEntries;
    private readonly IUnitOfWork _unitOfWork;

    public RentalCompletedDomainHandler(
        IRepository<Vehicle> vehicles,
        IRepository<Inspection> inspections,
        IRepository<TimelineEntry> timelineEntries,
        IUnitOfWork unitOfWork)
    {
        _vehicles = vehicles;
        _inspections = inspections;
        _timelineEntries = timelineEntries;
        _unitOfWork = unitOfWork;
    }

    public async Task Handle(RentalCompleted notification, CancellationToken ct)
    {
        var vehicle = await _vehicles.GetByIdAsync(notification.VehicleId, ct);
        if (vehicle is not null)
        {
            vehicle.UpdateStatus(VehicleStatus.Available);
            _vehicles.Update(vehicle);
        }

        var inspection = Inspection.Create(
            notification.VehicleId,
            notification.RentalId,
            InspectionType.PostRental,
            [],
            "Auto-created after rental completion");
        _inspections.Add(inspection);

        var entry = TimelineEntry.Create(
            "Rental", notification.RentalId, "RentalCompleted",
            $"Rental {notification.RentalId} completed with odometer {notification.OdometerEnd}.", "System");
        _timelineEntries.Add(entry);

        await _unitOfWork.SaveChangesAsync(ct);
    }
}
