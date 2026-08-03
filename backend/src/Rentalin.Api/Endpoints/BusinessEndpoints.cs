using MediatR;
using Rentalin.Fleet.Contracts;
using Rentalin.Fleet.Handlers;

namespace Rentalin.Api.Endpoints;

public static class BusinessEndpoints
{
    public static void MapBusinessEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/businesses");

        group.MapGet("/", async (IMediator mediator, CancellationToken ct) =>
        {
            return await mediator.Send(new GetBusinessesRequest(), ct);
        });

        group.MapPost("/", async (CreateBusinessRequest request, IMediator mediator, CancellationToken ct) =>
        {
            return await mediator.Send(request, ct);
        }).RequireAuthorization();

        group.MapPut("/{id:guid}", async (Guid id, UpdateBusinessRequest request, IMediator mediator, CancellationToken ct) =>
        {
            request.Id = id;
            return await mediator.Send(request, ct);
        }).RequireAuthorization();
    }
}
