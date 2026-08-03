using MediatR;
using Rentalin.Core.Interfaces;
using Rentalin.Reservations.Domain.Documents;
using Rentalin.Timeline.Domain.Entities;

namespace Rentalin.Reservations.Domain.Documents.Handlers;

public sealed class RentalOverdueDomainHandler : INotificationHandler<RentalOverdue>
{
    private readonly IRepository<TimelineEntry> _timelineEntries;
    private readonly IUnitOfWork _unitOfWork;

    public RentalOverdueDomainHandler(IRepository<TimelineEntry> timelineEntries, IUnitOfWork unitOfWork)
    {
        _timelineEntries = timelineEntries;
        _unitOfWork = unitOfWork;
    }

    public async Task Handle(RentalOverdue notification, CancellationToken ct)
    {
        var entry = TimelineEntry.Create(
            "Rental", notification.RentalId, "RentalOverdue",
            $"Rental {notification.RentalId} is overdue. Scheduled return was {notification.ScheduledEnd:g}.", "System");
        _timelineEntries.Add(entry);
        await _unitOfWork.SaveChangesAsync(ct);
    }
}
