using Microsoft.EntityFrameworkCore;
using Rentalin.Infrastructure.Data;
using Rentalin.Inspections.Domain.Entities;
using Rentalin.Reservations.Domain.Entities;

namespace Rentalin.Api.Endpoints;

public static class CustomerPortalEndpoints
{
    public static void MapCustomerPortalEndpoints(this WebApplication app)
    {
        app.MapGet("/api/portal/reservation/{id:guid}", async (Guid id, RentalinDbContext db, CancellationToken ct) =>
        {
            var reservation = await db.Reservations
                .AsNoTracking()
                .FirstOrDefaultAsync(r => r.Id == id, ct);

            if (reservation is null)
                return Results.NotFound(new { error = "Reservation not found" });

            var vehicle = await db.Vehicles
                .AsNoTracking()
                .FirstOrDefaultAsync(v => v.Id == reservation.VehicleId, ct);

            var customer = await db.Customers
                .AsNoTracking()
                .FirstOrDefaultAsync(c => c.Id == reservation.CustomerId, ct);

            var rental = await db.Rentals
                .AsNoTracking()
                .FirstOrDefaultAsync(r => r.ReservationId == id, ct);

            Inspection? inspection = null;
            if (rental is not null)
                inspection = await db.Inspections
                    .AsNoTracking()
                    .FirstOrDefaultAsync(i => i.RentalId == rental.Id, ct);

            return Results.Ok(new
            {
                reservationId = reservation.Id,
                status = reservation.Status.ToString(),
                customerName = customer?.Name ?? "Customer",
                customerPhone = customer?.Phone ?? "",
                vehiclePlate = vehicle?.LicensePlate ?? "",
                vehicleMake = vehicle?.Make ?? "",
                vehicleModel = vehicle?.Model ?? "",
                startDate = reservation.RentalPeriod.Start,
                endDate = reservation.RentalPeriod.End,
                estimatedCost = reservation.EstimatedCost.Amount,
                currency = reservation.EstimatedCost.Currency,
                rentalStarted = rental?.ActualStart,
                rentalEnded = rental?.ActualEnd,
                odometerStart = rental?.OdometerStart,
                odometerEnd = rental?.OdometerEnd,
                inspectionStatus = inspection?.Status.ToString(),
                inspectionNotes = inspection?.Notes
            });
        });
    }
}
