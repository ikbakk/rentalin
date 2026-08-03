using Microsoft.EntityFrameworkCore;
using Rentalin.Infrastructure.Data;
using Rentalin.Fleet.Domain.Enums;

namespace Rentalin.Api.Endpoints;

public static class PublicEndpoints
{
    public static void MapPublicEndpoints(this WebApplication app)
    {
        app.MapGet("/api/public/vehicles", async (RentalinDbContext db, CancellationToken ct) =>
        {
            var vehicles = await db.Vehicles
                .AsNoTracking()
                .Where(v => v.Status == VehicleStatus.Available)
                .Select(v => new
                {
                    id = v.Id,
                    licensePlate = v.LicensePlate,
                    make = v.Make,
                    model = v.Model,
                    year = v.Year,
                    color = v.Color,
                    seatingCapacity = v.SeatingCapacity,
                    dailyRateAmount = v.DailyRate.Amount,
                    dailyRateCurrency = v.DailyRate.Currency
                })
                .ToListAsync(ct);

            return Results.Ok(vehicles);
        });

        app.MapGet("/api/public/rentals/{id:guid}", async (Guid id, RentalinDbContext db, CancellationToken ct) =>
        {
            var rental = await db.Rentals
                .AsNoTracking()
                .FirstOrDefaultAsync(r => r.Id == id, ct);

            if (rental is null)
                return Results.NotFound(new { error = "Rental not found" });

            var reservation = await db.Reservations
                .AsNoTracking()
                .FirstOrDefaultAsync(r => r.Id == rental.ReservationId, ct);

            var vehicle = await db.Vehicles
                .AsNoTracking()
                .FirstOrDefaultAsync(v => v.Id == rental.VehicleId, ct);

            var customer = await db.Customers
                .AsNoTracking()
                .FirstOrDefaultAsync(c => c.Id == rental.CustomerId, ct);

            return Results.Ok(new
            {
                rentalId = rental.Id,
                status = rental.Status.ToString(),
                customerName = customer?.Name ?? "Customer",
                customerPhone = customer?.Phone ?? "",
                vehiclePlate = vehicle?.LicensePlate ?? "",
                vehicleMake = vehicle?.Make ?? "",
                vehicleModel = vehicle?.Model ?? "",
                startDate = reservation?.RentalPeriod.Start,
                endDate = reservation?.RentalPeriod.End,
                actualStart = rental.ActualStart,
                actualEnd = rental.ActualEnd,
                odometerStart = rental.OdometerStart,
                odometerEnd = rental.OdometerEnd,
                estimatedCost = reservation?.EstimatedCost.Amount ?? 0,
                currency = reservation?.EstimatedCost.Currency ?? "IDR"
            });
        });
    }
}
