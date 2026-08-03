using MediatR;
using Microsoft.EntityFrameworkCore;
using Rentalin.Fleet.Handlers;
using Rentalin.Infrastructure.Data;
using Rentalin.Reservations.Contracts;
using Rentalin.Reservations.Domain.Enums;

namespace Rentalin.Api.Endpoints;

public static class ReservationEndpoints
{
    public static void MapReservationEndpoints(this WebApplication app)
    {
        var inquiries = app.MapGroup("/api/inquiries");
        var reservations = app.MapGroup("/api/reservations");
        var rentals = app.MapGroup("/api/rentals");

        inquiries.MapGet("/", async (IMediator mediator, CancellationToken ct) =>
        {
            return await mediator.Send(new GetInquiriesRequest(), ct);
        }).RequireAuthorization();

        inquiries.MapGet("/{id:guid}", async (Guid id, IMediator mediator, CancellationToken ct) =>
        {
            return await mediator.Send(new GetInquiryByIdRequest(id), ct);
        }).RequireAuthorization();

        inquiries.MapPost("/", async (CreateInquiryRequest request, IMediator mediator, CancellationToken ct) =>
        {
            return await mediator.Send(request, ct);
        });

        inquiries.MapPost("/{id:guid}/confirm", async (Guid id, IMediator mediator, CancellationToken ct) =>
        {
            return await mediator.Send(new ConfirmInquiryRequest(id), ct);
        }).RequireAuthorization();

        inquiries.MapPost("/{id:guid}/cancel", async (Guid id, IMediator mediator, CancellationToken ct) =>
        {
            return await mediator.Send(new CancelInquiryRequest(id), ct);
        }).RequireAuthorization();

        reservations.MapGet("/", async (IMediator mediator, CancellationToken ct) =>
        {
            return await mediator.Send(new GetReservationsRequest(), ct);
        }).RequireAuthorization();

        reservations.MapGet("/{id:guid}", async (Guid id, IMediator mediator, CancellationToken ct) =>
        {
            return await mediator.Send(new GetReservationByIdRequest(id), ct);
        }).RequireAuthorization();

        reservations.MapPost("/", async (CreateReservationRequest request, IMediator mediator, CancellationToken ct) =>
        {
            return await mediator.Send(request, ct);
        }).RequireAuthorization();

        reservations.MapPost("/{id:guid}/prepare", async (Guid id, IMediator mediator, CancellationToken ct) =>
        {
            return await mediator.Send(new PrepareReservationRequest(id), ct);
        }).RequireAuthorization();

        reservations.MapPost("/{id:guid}/ready-for-handover", async (Guid id, IMediator mediator, CancellationToken ct) =>
        {
            return await mediator.Send(new ReadyForHandoverRequest(id), ct);
        }).RequireAuthorization();

        reservations.MapPost("/{id:guid}/handover-complete", async (Guid id, IMediator mediator, CancellationToken ct) =>
        {
            return await mediator.Send(new HandoverCompleteRequest(id), ct);
        }).RequireAuthorization();

        reservations.MapPost("/{id:guid}/start-rental", async (Guid id, StartRentalRequest request, IMediator mediator, CancellationToken ct) =>
        {
            return await mediator.Send(request with { ReservationId = id }, ct);
        }).RequireAuthorization();

        reservations.MapPost("/{id:guid}/cancel", async (Guid id, IMediator mediator, CancellationToken ct) =>
        {
            return await mediator.Send(new CancelReservationRequest(id), ct);
        }).RequireAuthorization();

        rentals.MapPost("/{id:guid}/reject", async (Guid id, RejectRentalRequest request, IMediator mediator, CancellationToken ct) =>
        {
            return await mediator.Send(request with { RentalId = id }, ct);
        }).RequireAuthorization();

        rentals.MapGet("/", async (IMediator mediator, CancellationToken ct) =>
        {
            return await mediator.Send(new GetRentalsRequest(), ct);
        }).RequireAuthorization();

        rentals.MapGet("/{id:guid}", async (Guid id, IMediator mediator, CancellationToken ct) =>
        {
            return await mediator.Send(new GetRentalByIdRequest(id), ct);
        }).RequireAuthorization();

        rentals.MapPost("/{id:guid}/complete", async (Guid id, CompleteRentalRequest request, IMediator mediator, CancellationToken ct) =>
        {
            return await mediator.Send(request with { RentalId = id }, ct);
        }).RequireAuthorization();

        rentals.MapGet("/history/{vehicleId:guid}", async (Guid vehicleId, RentalinDbContext db, CancellationToken ct) =>
        {
            var allRentals = await db.Rentals.AsNoTracking().Where(r => r.VehicleId == vehicleId).ToListAsync(ct);
            var customerIds = allRentals.Select(r => r.CustomerId).Distinct();
            var customers = await db.Customers.AsNoTracking().Where(c => customerIds.Contains(c.Id)).ToListAsync(ct);
            var customerDict = customers.ToDictionary(c => c.Id);

            var result = allRentals.Select(r => new
            {
                id = r.Id,
                reservationId = r.ReservationId,
                customerName = customerDict.TryGetValue(r.CustomerId, out var c) ? c.Name : "Unknown",
                actualStart = r.ActualStart,
                actualEnd = r.ActualEnd,
                odometerStart = r.OdometerStart,
                odometerEnd = r.OdometerEnd,
                status = r.Status.ToString()
            }).ToList();

            return Results.Ok(result);
        }).RequireAuthorization();

        rentals.MapPost("/check-overdue", async (RentalinDbContext db, CancellationToken ct) =>
        {
            var now = DateTimeOffset.UtcNow;
            var activeRentals = await db.Rentals
                .Where(r => r.Status == RentalStatus.Active)
                .ToListAsync(ct);

            var overdueCount = 0;
            foreach (var rental in activeRentals)
            {
                var reservation = await db.Reservations
                    .AsNoTracking()
                    .FirstOrDefaultAsync(r => r.Id == rental.ReservationId, ct);

                if (reservation is not null && reservation.RentalPeriod.End < now)
                {
                    var rentalEntity = await db.Rentals.FirstAsync(r => r.Id == rental.Id, ct);
                    rentalEntity.MarkOverdue(reservation.RentalPeriod.End);
                    overdueCount++;
                }
            }

            if (overdueCount > 0)
            {
                await db.SaveChangesAsync(ct);
            }

            return Results.Ok(new { markedOverdue = overdueCount });
        });

        rentals.MapPost("/{id:guid}/extend", async (Guid id, ExtendRentalRequest request, IMediator mediator, CancellationToken ct) =>
        {
            return await mediator.Send(request with { RentalId = id }, ct);
        }).RequireAuthorization();
    }
}
