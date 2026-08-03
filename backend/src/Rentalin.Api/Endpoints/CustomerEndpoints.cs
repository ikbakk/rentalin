using MediatR;
using Rentalin.Reservations.Contracts;

namespace Rentalin.Api.Endpoints;

public static class CustomerEndpoints
{
    public static void MapCustomerEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/customers");

        group.MapGet("/", async (IMediator mediator, CancellationToken ct) =>
        {
            return await mediator.Send(new GetCustomersRequest(), ct);
        }).RequireAuthorization();

        group.MapGet("/{id:guid}", async (Guid id, IMediator mediator, CancellationToken ct) =>
        {
            return await mediator.Send(new GetCustomerByIdRequest(id), ct);
        }).RequireAuthorization();

        group.MapPost("/", async (CreateCustomerRequest request, IMediator mediator, CancellationToken ct) =>
        {
            return await mediator.Send(request, ct);
        }).RequireAuthorization();

        group.MapPut("/{id:guid}", async (Guid id, UpdateCustomerRequest request, IMediator mediator, CancellationToken ct) =>
        {
            return await mediator.Send(request with { Id = id }, ct);
        }).RequireAuthorization();
    }
}
