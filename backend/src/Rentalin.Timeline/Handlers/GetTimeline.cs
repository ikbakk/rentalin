using MediatR;
using Rentalin.Core.Interfaces;
using Rentalin.Timeline.Contracts;
using Rentalin.Timeline.Domain.Entities;

namespace Rentalin.Timeline.Handlers;

public sealed class GetTimelineHandler : IRequestHandler<GetTimelineRequest, IReadOnlyList<TimelineEntryResponse>>
{
    private readonly IRepository<TimelineEntry> _timelineEntries;

    public GetTimelineHandler(IRepository<TimelineEntry> timelineEntries)
    {
        _timelineEntries = timelineEntries;
    }

    public async Task<IReadOnlyList<TimelineEntryResponse>> Handle(GetTimelineRequest request, CancellationToken ct)
    {
        var all = await _timelineEntries.GetAllAsync(ct);

        var query = all.AsEnumerable();

        if (request.ReferenceType is not null)
            query = query.Where(e => e.ReferenceType == request.ReferenceType);

        if (request.ReferenceId is not null)
            query = query.Where(e => e.ReferenceId == request.ReferenceId.Value);

        var result = query
            .OrderByDescending(e => e.OccurredAt)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(e => new TimelineEntryResponse(
                e.Id, e.ReferenceType, e.ReferenceId,
                e.EventType, e.Description, e.OccurredAt, e.Actor))
            .ToList();

        return result;
    }
}
