using MediatR;
using Rentalin.Core.Interfaces;
using Rentalin.Fleet.Domain.Documents;
using Rentalin.Timeline.Domain.Entities;

namespace Rentalin.Fleet.Domain.Documents.Handlers;

public sealed class VehicleCreatedDomainHandler : INotificationHandler<VehicleCreated>
{
    private readonly IRepository<TimelineEntry> _timelineEntries;
    private readonly IUnitOfWork _unitOfWork;

    public VehicleCreatedDomainHandler(IRepository<TimelineEntry> timelineEntries, IUnitOfWork unitOfWork)
    {
        _timelineEntries = timelineEntries;
        _unitOfWork = unitOfWork;
    }

    public async Task Handle(VehicleCreated notification, CancellationToken ct)
    {
        var entry = TimelineEntry.Create(
            "Vehicle", notification.VehicleId, "VehicleCreated",
            $"Vehicle {notification.LicensePlate} ({notification.VehicleId}) was created.", "System");
        _timelineEntries.Add(entry);
        await _unitOfWork.SaveChangesAsync(ct);
    }
}
