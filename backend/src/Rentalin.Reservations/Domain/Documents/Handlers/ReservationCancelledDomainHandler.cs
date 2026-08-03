using MediatR;
using Rentalin.Core.Interfaces;
using Rentalin.Reservations.Domain.Documents;
using Rentalin.Timeline.Domain.Entities;

namespace Rentalin.Reservations.Domain.Documents.Handlers;

public sealed class ReservationCancelledDomainHandler : INotificationHandler<ReservationCancelled>
{
    private readonly IRepository<TimelineEntry> _timelineEntries;
    private readonly IUnitOfWork _unitOfWork;
    private readonly INotificationService _notificationService;

    public ReservationCancelledDomainHandler(
        IRepository<TimelineEntry> timelineEntries,
        IUnitOfWork unitOfWork,
        INotificationService notificationService)
    {
        _timelineEntries = timelineEntries;
        _unitOfWork = unitOfWork;
        _notificationService = notificationService;
    }

    public async Task Handle(ReservationCancelled notification, CancellationToken ct)
    {
        var reasonText = notification.Reason ?? "No reason provided.";
        var entry = TimelineEntry.Create(
            "Reservation", notification.ReservationId, "ReservationCancelled",
            $"Reservation {notification.ReservationId} cancelled. Reason: {reasonText}", "System");
        _timelineEntries.Add(entry);

        await _notificationService.SendAsync(
            "admin@rentalin.id",
            "Reservation Cancelled",
            $"Reservation {notification.ReservationId} was cancelled. Reason: {reasonText}",
            ct);

        await _unitOfWork.SaveChangesAsync(ct);
    }
}
