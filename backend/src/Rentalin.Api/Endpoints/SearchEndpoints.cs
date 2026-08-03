using Microsoft.EntityFrameworkCore;
using Rentalin.Infrastructure.Data;

namespace Rentalin.Api.Endpoints;

public static class SearchEndpoints
{
    public static void MapSearchEndpoints(this WebApplication app)
    {
        app.MapGet("/api/search", async (
            string q,
            bool includeReservations,
            RentalinDbContext db,
            CancellationToken ct) =>
        {
            if (string.IsNullOrWhiteSpace(q) || q.Length < 2)
                return Results.Ok(new {
                    vehicles = Array.Empty<object>(),
                    customers = Array.Empty<object>(),
                    reservations = Array.Empty<object>()
                });

            var term = q.ToLower();

            var vehicles = await db.Vehicles.AsNoTracking()
                .Where(v => v.LicensePlate.ToLower().Contains(term)
                    || v.Make.ToLower().Contains(term)
                    || v.Model.ToLower().Contains(term))
                .Take(5)
                .Select(v => new {
                    Id = v.Id.ToString(),
                    v.LicensePlate,
                    v.Make,
                    v.Model,
                    Status = v.Status.ToString(),
                    Type = "Vehicle"
                })
                .ToListAsync(ct);

            var customers = await db.Customers.AsNoTracking()
                .Where(c => c.Name.ToLower().Contains(term) || c.Phone.Contains(term))
                .Take(5)
                .Select(c => new {
                    Id = c.Id.ToString(),
                    c.Name,
                    Phone = c.Phone,
                    Type = "Customer"
                })
                .ToListAsync(ct);

            var reservations = includeReservations
                ? (IReadOnlyList<object>)await db.Reservations.AsNoTracking()
                    .Where(r => r.Id.ToString().Contains(term))
                    .Take(5)
                    .Select(r => new {
                        Id = r.Id.ToString(),
                        CustomerId = r.CustomerId.ToString(),
                        VehicleId = r.VehicleId.ToString(),
                        Status = r.Status.ToString(),
                        Type = "Reservation"
                    })
                    .ToListAsync(ct)
                : Array.Empty<object>();

            return Results.Ok(new { vehicles, customers, reservations });
        }).RequireAuthorization();
    }
}
