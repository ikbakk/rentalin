using MediatR;
using Rentalin.Core.Interfaces;
using Rentalin.Reservations.Domain.Documents;
using Rentalin.Timeline.Domain.Entities;

namespace Rentalin.Reservations.Domain.Documents.Handlers;

public sealed class InquiryConfirmedDomainHandler : INotificationHandler<InquiryConfirmed>
{
    private readonly IRepository<TimelineEntry> _timelineEntries;
    private readonly IUnitOfWork _unitOfWork;
    private readonly INotificationService _notificationService;

    public InquiryConfirmedDomainHandler(
        IRepository<TimelineEntry> timelineEntries,
        IUnitOfWork unitOfWork,
        INotificationService notificationService)
    {
        _timelineEntries = timelineEntries;
        _unitOfWork = unitOfWork;
        _notificationService = notificationService;
    }

    public async Task Handle(InquiryConfirmed notification, CancellationToken ct)
    {
        var entry = TimelineEntry.Create(
            "Inquiry", notification.InquiryId, "InquiryConfirmed",
            $"Inquiry {notification.InquiryId} was confirmed.", "System");
        _timelineEntries.Add(entry);

        await _notificationService.SendAsync(
            "admin@rentalin.id",
            "Inquiry Confirmed",
            $"Inquiry {notification.InquiryId} has been confirmed.",
            ct);

        await _unitOfWork.SaveChangesAsync(ct);
    }
}
