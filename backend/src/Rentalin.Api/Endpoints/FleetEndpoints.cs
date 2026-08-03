using MediatR;
using Rentalin.Fleet.Contracts;
using Rentalin.Fleet.Handlers;

namespace Rentalin.Api.Endpoints;

public static class FleetEndpoints
{
    public static void MapFleetEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/vehicles");

        group.MapGet("/", async (IMediator mediator, CancellationToken ct) =>
        {
            return await mediator.Send(new GetVehiclesRequest(), ct);
        }).RequireAuthorization();

        group.MapGet("/{id:guid}", async (Guid id, IMediator mediator, CancellationToken ct) =>
        {
            return await mediator.Send(new GetVehicleByIdRequest(id), ct);
        }).RequireAuthorization();

        group.MapPost("/", async (CreateVehicleRequest request, IMediator mediator, CancellationToken ct) =>
        {
            return await mediator.Send(request, ct);
        }).RequireAuthorization();

        group.MapPut("/{id:guid}", async (Guid id, UpdateVehicleRequest request, IMediator mediator, CancellationToken ct) =>
        {
            return await mediator.Send(request with { VehicleId = id }, ct);
        }).RequireAuthorization();

        group.MapPut("/{id:guid}/status", async (Guid id, UpdateVehicleStatusRequest request, IMediator mediator, CancellationToken ct) =>
        {
            return await mediator.Send(request with { VehicleId = id }, ct);
        }).RequireAuthorization();
    }
}
