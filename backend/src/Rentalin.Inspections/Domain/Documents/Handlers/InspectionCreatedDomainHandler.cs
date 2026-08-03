using MediatR;
using Rentalin.Core.Interfaces;
using Rentalin.Inspections.Domain.Documents;
using Rentalin.Timeline.Domain.Entities;

namespace Rentalin.Inspections.Domain.Documents.Handlers;

public sealed class InspectionCreatedDomainHandler : INotificationHandler<InspectionCreated>
{
    private readonly IRepository<TimelineEntry> _timelineEntries;
    private readonly IUnitOfWork _unitOfWork;

    public InspectionCreatedDomainHandler(IRepository<TimelineEntry> timelineEntries, IUnitOfWork unitOfWork)
    {
        _timelineEntries = timelineEntries;
        _unitOfWork = unitOfWork;
    }

    public async Task Handle(InspectionCreated notification, CancellationToken ct)
    {
        var entry = TimelineEntry.Create(
            "Inspection", notification.InspectionId, "InspectionCreated",
            $"Inspection {notification.InspectionId} was created.", "System");
        _timelineEntries.Add(entry);
        await _unitOfWork.SaveChangesAsync(ct);
    }
}
