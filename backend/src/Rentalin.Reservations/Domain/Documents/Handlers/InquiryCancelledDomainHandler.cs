using MediatR;
using Rentalin.Core.Interfaces;
using Rentalin.Reservations.Domain.Documents;
using Rentalin.Timeline.Domain.Entities;

namespace Rentalin.Reservations.Domain.Documents.Handlers;

public sealed class InquiryCancelledDomainHandler : INotificationHandler<InquiryCancelled>
{
    private readonly IRepository<TimelineEntry> _timelineEntries;
    private readonly IUnitOfWork _unitOfWork;
    private readonly INotificationService _notificationService;

    public InquiryCancelledDomainHandler(
        IRepository<TimelineEntry> timelineEntries,
        IUnitOfWork unitOfWork,
        INotificationService notificationService)
    {
        _timelineEntries = timelineEntries;
        _unitOfWork = unitOfWork;
        _notificationService = notificationService;
    }

    public async Task Handle(InquiryCancelled notification, CancellationToken ct)
    {
        var reasonText = notification.Reason ?? "No reason provided.";
        var entry = TimelineEntry.Create(
            "Inquiry", notification.InquiryId, "InquiryCancelled",
            $"Inquiry {notification.InquiryId} cancelled. Reason: {reasonText}", "System");
        _timelineEntries.Add(entry);

        await _notificationService.SendAsync(
            "admin@rentalin.id",
            "Inquiry Cancelled",
            $"Inquiry {notification.InquiryId} was cancelled. Reason: {reasonText}",
            ct);

        await _unitOfWork.SaveChangesAsync(ct);
    }
}
