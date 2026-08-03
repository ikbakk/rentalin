using MediatR;
using Rentalin.Inspections.Contracts;

namespace Rentalin.Api.Endpoints;

public static class InspectionEndpoints
{
    public static void MapInspectionEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/inspections");

        group.MapGet("/", async (IMediator mediator, CancellationToken ct) =>
        {
            return await mediator.Send(new GetInspectionsRequest(), ct);
        }).RequireAuthorization();

        group.MapGet("/{id:guid}", async (Guid id, IMediator mediator, CancellationToken ct) =>
        {
            return await mediator.Send(new GetInspectionByIdRequest(id), ct);
        }).RequireAuthorization();

        group.MapPost("/", async (CreateInspectionRequest request, IMediator mediator, CancellationToken ct) =>
        {
            return await mediator.Send(request, ct);
        }).RequireAuthorization();

        group.MapPut("/{id:guid}/complete", async (Guid id, CompleteInspectionRequest request, IMediator mediator, CancellationToken ct) =>
        {
            return await mediator.Send(request with { InspectionId = id }, ct);
        }).RequireAuthorization();

        group.MapPut("/{id:guid}/fail", async (Guid id, FailInspectionRequest request, IMediator mediator, CancellationToken ct) =>
        {
            return await mediator.Send(request with { InspectionId = id }, ct);
        }).RequireAuthorization();
    }
}
