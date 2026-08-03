using MediatR;
using Rentalin.Core.Interfaces;
using Rentalin.Reservations.Domain.Documents;
using Rentalin.Timeline.Domain.Entities;

namespace Rentalin.Reservations.Domain.Documents.Handlers;

public sealed class RentalCompletedDomainHandler : INotificationHandler<RentalCompleted>
{
    private readonly IRepository<TimelineEntry> _timelineEntries;
    private readonly IUnitOfWork _unitOfWork;

    public RentalCompletedDomainHandler(IRepository<TimelineEntry> timelineEntries, IUnitOfWork unitOfWork)
    {
        _timelineEntries = timelineEntries;
        _unitOfWork = unitOfWork;
    }

    public async Task Handle(RentalCompleted notification, CancellationToken ct)
    {
        var entry = TimelineEntry.Create(
            "Rental", notification.RentalId, "RentalCompleted",
            $"Rental {notification.RentalId} completed with odometer {notification.OdometerEnd}.", "System");
        _timelineEntries.Add(entry);
        await _unitOfWork.SaveChangesAsync(ct);
    }
}
