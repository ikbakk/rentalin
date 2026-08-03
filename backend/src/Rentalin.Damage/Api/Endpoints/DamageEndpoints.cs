using MediatR;
using Microsoft.AspNetCore.Builder;
using Rentalin.Damage.Handlers;

namespace Rentalin.Damage.Api.Endpoints;

public static class DamageEndpoints
{
    public static void MapDamageEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/damage");

        group.MapGet("/", async (Guid? rentalId, Guid? vehicleId, IMediator mediator, CancellationToken ct) =>
        {
            return await mediator.Send(new GetDamageRecordsRequest(rentalId, vehicleId), ct);
        }).RequireAuthorization();

        group.MapPost("/", async (CreateDamageRecordRequest request, IMediator mediator, CancellationToken ct) =>
        {
            return await mediator.Send(request, ct);
        }).RequireAuthorization();

        group.MapPut("/{id:guid}/resolve", async (Guid id, ResolveDamageRequest request, IMediator mediator, CancellationToken ct) =>
        {
            return await mediator.Send(request with { DamageId = id }, ct);
        }).RequireAuthorization();

        group.MapPut("/{id:guid}/waive", async (Guid id, WaiveDamageRequest request, IMediator mediator, CancellationToken ct) =>
        {
            return await mediator.Send(request with { DamageId = id }, ct);
        }).RequireAuthorization();
    }
}
