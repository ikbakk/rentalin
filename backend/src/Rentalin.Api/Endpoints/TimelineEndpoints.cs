using MediatR;
using Rentalin.Timeline.Contracts;

namespace Rentalin.Api.Endpoints;

public static class TimelineEndpoints
{
    public static void MapTimelineEndpoints(this WebApplication app)
    {
        app.MapGet("/api/timeline", async (
            string? referenceType,
            Guid? referenceId,
            int? page,
            int? pageSize,
            IMediator mediator,
            CancellationToken ct) =>
        {
            var request = new GetTimelineRequest(referenceType, referenceId, page ?? 1, pageSize ?? 50);
            return await mediator.Send(request, ct);
        }).RequireAuthorization();
    }
}
