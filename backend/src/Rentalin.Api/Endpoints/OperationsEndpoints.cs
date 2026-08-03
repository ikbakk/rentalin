using Microsoft.EntityFrameworkCore;
using Rentalin.Api.Contracts;
using Rentalin.Fleet.Domain.Enums;
using Rentalin.Infrastructure.Data;
using Rentalin.Inspections.Domain.Enums;
using Rentalin.Reservations.Domain.Enums;

namespace Rentalin.Api.Endpoints;

public static class OperationsEndpoints
{
    public static void MapOperationsEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/operations");

        group.MapGet("/summary", async (RentalinDbContext db, CancellationToken ct) =>
        {
            var vehicles = await db.Vehicles.AsNoTracking().ToListAsync(ct);
            var todayStart = DateTimeOffset.UtcNow.Date;
            var todayEnd = todayStart.AddDays(1);

            var completed = await db.Payments
                .Where(p => p.Status == PaymentStatus.Completed && p.PaidAt != null)
                .ToListAsync(ct);

            var todayRevenue = completed
                .Where(p => p.PaidAt!.Value >= todayStart && p.PaidAt!.Value < todayEnd)
                .Sum(p => p.Amount.Amount);

            return new OperationsSummaryResponse(
                TotalVehicles: vehicles.Count,
                AvailableVehicles: vehicles.Count(v => v.Status == VehicleStatus.Available),
                RentedVehicles: vehicles.Count(v => v.Status == VehicleStatus.Rented),
                ActiveInquiries: await db.Inquiries.CountAsync(i => i.Status == InquiryStatus.Pending, ct),
                ActiveReservations: await db.Reservations.CountAsync(r => r.Status == ReservationStatus.Active, ct),
                ActiveRentals: await db.Rentals.CountAsync(r => r.Status == RentalStatus.Active, ct),
                PendingInspections: await db.Inspections.CountAsync(i => i.Status == InspectionStatus.Pending, ct),
                TodayRevenue: todayRevenue,
                RevenueCurrency: "IDR"
            );
        }).RequireAuthorization();

        group.MapGet("/fleet-status", async (RentalinDbContext db, CancellationToken ct) =>
        {
            var vehicles = await db.Vehicles
                .AsNoTracking()
                .Select(v => new FleetStatusItem(v.Id, v.LicensePlate, v.Status.ToString()))
                .ToListAsync(ct);

            return new FleetStatusResponse(vehicles);
        }).RequireAuthorization();
    }
}
