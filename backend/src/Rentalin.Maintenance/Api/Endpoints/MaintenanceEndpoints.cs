using MediatR;
using Microsoft.AspNetCore.Builder;
using Rentalin.Maintenance.Handlers;

namespace Rentalin.Maintenance.Api.Endpoints;

public static class MaintenanceEndpoints
{
    public static void MapMaintenanceEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/maintenance");

        group.MapGet("/", async (Guid? vehicleId, IMediator mediator, CancellationToken ct) =>
        {
            return await mediator.Send(new GetMaintenanceRequest(vehicleId), ct);
        }).RequireAuthorization();

        group.MapPost("/", async (CreateMaintenanceRequest request, IMediator mediator, CancellationToken ct) =>
        {
            return await mediator.Send(request, ct);
        }).RequireAuthorization();

        group.MapPut("/{id:guid}/start", async (Guid id, IMediator mediator, CancellationToken ct) =>
        {
            return await mediator.Send(new StartMaintenanceRequest(id), ct);
        }).RequireAuthorization();

        group.MapPut("/{id:guid}/complete", async (Guid id, CompleteMaintenanceRequest request, IMediator mediator, CancellationToken ct) =>
        {
            return await mediator.Send(request with { MaintenanceId = id }, ct);
        }).RequireAuthorization();

        group.MapPut("/{id:guid}/cancel", async (Guid id, CancelMaintenanceRequest request, IMediator mediator, CancellationToken ct) =>
        {
            return await mediator.Send(request with { MaintenanceId = id }, ct);
        }).RequireAuthorization();
    }
}
