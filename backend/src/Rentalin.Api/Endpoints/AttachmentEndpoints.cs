using MediatR;
using Rentalin.Fleet.Contracts;

namespace Rentalin.Api.Endpoints;

public static class AttachmentEndpoints
{
    public static void MapAttachmentEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/attachments");

        group.MapGet("/", async (string referenceType, Guid referenceId, IMediator mediator, CancellationToken ct) =>
        {
            return await mediator.Send(new GetAttachmentsRequest(referenceType, referenceId), ct);
        });

        group.MapPost("/", async (CreateAttachmentRequest request, IMediator mediator, CancellationToken ct) =>
        {
            return await mediator.Send(request, ct);
        }).RequireAuthorization();
    }
}
