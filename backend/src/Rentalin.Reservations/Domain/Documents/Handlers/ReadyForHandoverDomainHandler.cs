using MediatR;
using Rentalin.Core.Interfaces;
using Rentalin.Reservations.Domain.Documents;
using Rentalin.Timeline.Domain.Entities;

namespace Rentalin.Reservations.Domain.Documents.Handlers;

public sealed class ReadyForHandoverDomainHandler : INotificationHandler<ReadyForHandover>
{
    private readonly IRepository<TimelineEntry> _timelineEntries;
    private readonly IUnitOfWork _unitOfWork;

    public ReadyForHandoverDomainHandler(IRepository<TimelineEntry> timelineEntries, IUnitOfWork unitOfWork)
    {
        _timelineEntries = timelineEntries;
        _unitOfWork = unitOfWork;
    }

    public async Task Handle(ReadyForHandover notification, CancellationToken ct)
    {
        var entry = TimelineEntry.Create(
            "Reservation", notification.ReservationId, "ReadyForHandover",
            $"Reservation {notification.ReservationId} is ready for handover.", "System");
        _timelineEntries.Add(entry);
        await _unitOfWork.SaveChangesAsync(ct);
    }
}
