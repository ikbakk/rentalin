namespace Rentalin.Timeline.Contracts;

public sealed record TimelineEntryResponse(
    Guid Id,
    string ReferenceType,
    Guid ReferenceId,
    string EventType,
    string Description,
    DateTimeOffset OccurredAt,
    string Actor);
