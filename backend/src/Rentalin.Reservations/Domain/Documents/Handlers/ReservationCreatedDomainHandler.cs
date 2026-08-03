using MediatR;
using Rentalin.Core.Interfaces;
using Rentalin.Reservations.Domain.Documents;
using Rentalin.Timeline.Domain.Entities;

namespace Rentalin.Reservations.Domain.Documents.Handlers;

public sealed class ReservationCreatedDomainHandler : INotificationHandler<ReservationCreated>
{
    private readonly IRepository<TimelineEntry> _timelineEntries;
    private readonly IUnitOfWork _unitOfWork;
    private readonly INotificationService _notificationService;

    public ReservationCreatedDomainHandler(
        IRepository<TimelineEntry> timelineEntries,
        IUnitOfWork unitOfWork,
        INotificationService notificationService)
    {
        _timelineEntries = timelineEntries;
        _unitOfWork = unitOfWork;
        _notificationService = notificationService;
    }

    public async Task Handle(ReservationCreated notification, CancellationToken ct)
    {
        var entry = TimelineEntry.Create(
            "Reservation", notification.ReservationId, "ReservationCreated",
            $"Reservation {notification.ReservationId} was created.", "System");
        _timelineEntries.Add(entry);

        await _notificationService.SendAsync(
            "admin@rentalin.id",
            "Reservation Created",
            $"Reservation {notification.ReservationId} has been created for customer {notification.CustomerId}.",
            ct);

        await _unitOfWork.SaveChangesAsync(ct);
    }
}
