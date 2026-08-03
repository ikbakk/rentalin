using MediatR;
using Rentalin.Core.Interfaces;
using Rentalin.Reservations.Domain.Documents;
using Rentalin.Timeline.Domain.Entities;

namespace Rentalin.Reservations.Domain.Documents.Handlers;

public sealed class RentalExtendedDomainHandler : INotificationHandler<RentalExtended>
{
    private readonly IRepository<TimelineEntry> _timelineEntries;
    private readonly IUnitOfWork _unitOfWork;

    public RentalExtendedDomainHandler(IRepository<TimelineEntry> timelineEntries, IUnitOfWork unitOfWork)
    {
        _timelineEntries = timelineEntries;
        _unitOfWork = unitOfWork;
    }

    public async Task Handle(RentalExtended notification, CancellationToken ct)
    {
        var entry = TimelineEntry.Create(
            "Rental", notification.RentalId, "RentalExtended",
            $"Rental {notification.RentalId} extended to {notification.NewEnd:g}. Additional cost: {notification.AdditionalCost:C}.", "System");
        _timelineEntries.Add(entry);
        await _unitOfWork.SaveChangesAsync(ct);
    }
}
