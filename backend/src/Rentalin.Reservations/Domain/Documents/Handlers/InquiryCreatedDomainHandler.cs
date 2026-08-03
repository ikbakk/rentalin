using MediatR;
using Rentalin.Core.Interfaces;
using Rentalin.Reservations.Domain.Documents;
using Rentalin.Timeline.Domain.Entities;

namespace Rentalin.Reservations.Domain.Documents.Handlers;

public sealed class InquiryCreatedDomainHandler : INotificationHandler<InquiryCreated>
{
    private readonly IRepository<TimelineEntry> _timelineEntries;
    private readonly IUnitOfWork _unitOfWork;

    public InquiryCreatedDomainHandler(IRepository<TimelineEntry> timelineEntries, IUnitOfWork unitOfWork)
    {
        _timelineEntries = timelineEntries;
        _unitOfWork = unitOfWork;
    }

    public async Task Handle(InquiryCreated notification, CancellationToken ct)
    {
        var entry = TimelineEntry.Create(
            "Inquiry", notification.InquiryId, "InquiryCreated",
            $"Inquiry {notification.InquiryId} was created.", "System");
        _timelineEntries.Add(entry);
        await _unitOfWork.SaveChangesAsync(ct);
    }
}
