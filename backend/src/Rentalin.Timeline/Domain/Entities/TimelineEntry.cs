using Rentalin.Core.Entities;

namespace Rentalin.Timeline.Domain.Entities;

public sealed class TimelineEntry : AggregateRoot
{
    public string ReferenceType { get; private set; }
    public Guid ReferenceId { get; private set; }
    public string EventType { get; private set; }
    public string Description { get; private set; }
    public DateTimeOffset OccurredAt { get; private set; }
    public string Actor { get; private set; }

    private TimelineEntry()
    {
        ReferenceType = string.Empty;
        EventType = string.Empty;
        Description = string.Empty;
        Actor = string.Empty;
    }

    public static TimelineEntry Create(
        string referenceType, Guid referenceId, string eventType,
        string description, string actor)
    {
        return new TimelineEntry
        {
            Id = Guid.NewGuid(),
            ReferenceType = referenceType,
            ReferenceId = referenceId,
            EventType = eventType,
            Description = description,
            OccurredAt = DateTimeOffset.UtcNow,
            Actor = actor
        };
    }
}
