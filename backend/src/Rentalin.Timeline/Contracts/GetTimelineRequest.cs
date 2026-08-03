using MediatR;

namespace Rentalin.Timeline.Contracts;

public sealed record GetTimelineRequest(
    string? ReferenceType,
    Guid? ReferenceId,
    int Page = 1,
    int PageSize = 50) : IRequest<IReadOnlyList<TimelineEntryResponse>>;
