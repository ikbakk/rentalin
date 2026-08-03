using MediatR;
using Rentalin.Reservations.Contracts;

namespace Rentalin.Api.Endpoints;

public static class PaymentEndpoints
{
    public static void MapPaymentEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/payments");

        group.MapGet("/", async (Guid? rentalId, IMediator mediator, CancellationToken ct) =>
        {
            return await mediator.Send(new GetPaymentsRequest(rentalId), ct);
        }).RequireAuthorization();

        group.MapPost("/", async (CreatePaymentRequest request, IMediator mediator, CancellationToken ct) =>
        {
            return await mediator.Send(request, ct);
        }).RequireAuthorization();

        group.MapPost("/{id:guid}/complete", async (Guid id, IMediator mediator, CancellationToken ct) =>
        {
            return await mediator.Send(new MarkPaymentCompleteRequest(id), ct);
        }).RequireAuthorization();

        group.MapPost("/{id:guid}/refund", async (Guid id, IMediator mediator, CancellationToken ct) =>
        {
            return await mediator.Send(new RefundPaymentRequest(id), ct);
        }).RequireAuthorization("OwnerOnly");
    }
}
