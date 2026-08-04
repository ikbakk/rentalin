using System.Text.Json;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Rentalin.Fleet.Domain.Entities;
using Rentalin.Infrastructure.Data;
using Rentalin.Fleet.Domain.Enums;
using Rentalin.Reservations.Contracts;

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

        app.MapGet("/api/public/{slug}", async (string slug, RentalinDbContext db, CancellationToken ct) =>
        {
            if (slug.Length > 100)
                return Results.NotFound(new { error = "Business not found" });

            var business = await db.Businesses
                .AsNoTracking()
                .FirstOrDefaultAsync(b => b.Slug == slug, ct);

            if (business is null)
                return Results.NotFound(new { error = "Business not found" });

            return Results.Ok(new
            {
                name = business.Name,
                slug = business.Slug,
                address = business.Address,
                phoneNumber = business.PhoneNumber,
                email = business.Email,
                logoUrl = business.LogoUrl
            });
        });

        app.MapGet("/api/public/{slug}/vehicles", async (string slug, RentalinDbContext db, CancellationToken ct) =>
        {
            var business = await db.Businesses
                .AsNoTracking()
                .FirstOrDefaultAsync(b => b.Slug == slug, ct);

            if (business is null)
                return Results.NotFound(new { error = "Business not found" });

            var vehicles = await db.Vehicles
                .AsNoTracking()
                .Where(v => v.BusinessId == business.Id && v.Status == VehicleStatus.Available)
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

        app.MapPost("/api/public/{slug}/inquiries", async (string slug, HttpRequest request, RentalinDbContext db, IMediator mediator, CancellationToken ct) =>
        {
            var business = await db.Businesses
                .AsNoTracking()
                .FirstOrDefaultAsync(b => b.Slug == slug, ct);

            if (business is null)
                return Results.NotFound(new { error = "Business not found" });

            var body = await request.ReadFromJsonAsync<JsonElement>(ct);

            var vehicleId = body.GetProperty("vehicleId").GetGuid();
            var vehicle = await db.Vehicles.FindAsync(new object[] { vehicleId }, ct);
            if (vehicle is null)
                return Results.BadRequest(new { error = "Vehicle not found" });

            if (vehicle.BusinessId != business.Id)
                return Results.BadRequest(new { error = "Vehicle does not belong to this business" });

            var inquiryRequest = new CreateInquiryRequest(
                CustomerId: null,
                VehicleId: vehicleId,
                StartDate: DateTimeOffset.Parse(body.GetProperty("startDate").GetString()!),
                EndDate: DateTimeOffset.Parse(body.GetProperty("endDate").GetString()!),
                Notes: body.TryGetProperty("notes", out var n) && n.ValueKind != JsonValueKind.Null ? n.GetString() : null,
                CustomerName: body.GetProperty("customerName").GetString(),
                CustomerPhone: body.GetProperty("customerPhone").GetString()
            );

            var response = await mediator.Send(inquiryRequest, ct);
            return Results.Ok(response);
        });
    }
}
