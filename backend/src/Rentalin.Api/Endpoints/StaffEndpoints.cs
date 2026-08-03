using MediatR;
using Rentalin.Fleet.Contracts;
using Rentalin.Fleet.Handlers;

namespace Rentalin.Api.Endpoints;

public static class StaffEndpoints
{
    public static void MapStaffEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/staff");

        group.MapGet("/", async (IMediator mediator, CancellationToken ct) =>
        {
            return await mediator.Send(new GetStaffRequest(), ct);
        });

        group.MapPost("/", async (CreateStaffRequest request, IMediator mediator, CancellationToken ct) =>
        {
            return await mediator.Send(request, ct);
        }).RequireAuthorization();

        group.MapPut("/{id:guid}/deactivate", async (Guid id, IMediator mediator, CancellationToken ct) =>
        {
            return await mediator.Send(new DeactivateStaffRequest(id), ct);
        }).RequireAuthorization();
    }
}
