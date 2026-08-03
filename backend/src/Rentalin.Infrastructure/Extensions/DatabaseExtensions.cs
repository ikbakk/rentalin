using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Rentalin.Core.ValueObjects;
using Rentalin.Fleet.Domain.Entities;
using Rentalin.Infrastructure.Data;
using Rentalin.Reservations.Domain.Entities;

namespace Rentalin.Infrastructure.Extensions;

public static class DatabaseExtensions
{
    public static void ApplyMigrationsAndSeed(this IServiceProvider services)
    {
        using var scope = services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<RentalinDbContext>();
        db.Database.Migrate();

        if (!db.Businesses.Any())
        {
            db.Businesses.Add(Business.Create("Rentalin", "Jl. Sudirman No. 1, Jakarta", "+62-21-5555-1234", "info@rentalin.com"));
            db.SaveChanges();
        }

        var businessId = db.Businesses.First().Id;

        if (!db.Staff.Any())
        {
            var admin = Staff.Create("Admin Owner", "admin@rentalin.com", "+62-800-0000-0000", "Owner", businessId);
            admin.SetPassword("admin123");
            db.Staff.Add(admin);
            db.SaveChanges();
        }

        if (!db.Customers.Any())
        {
            db.Customers.AddRange(
                Customer.Create("Budi Santoso", "budi@email.com", "+62-812-3456-7890", "Repeat customer"),
                Customer.Create("Siti Rahayu", "siti@email.com", "+62-813-9876-5432", null),
                Customer.Create("Agus Wijaya", "agus@email.com", "+62-811-1111-2222", "Prefers Toyota Avanza")
            );
            db.SaveChanges();
        }

        if (db.Vehicles.Any()) return;

        db.Vehicles.AddRange(
            Vehicle.Create("B 1234 ABC", "Toyota", "Avanza", 2023, "Silver", 7, new Money(350_000m, "IDR"), businessId),
            Vehicle.Create("B 5678 DEF", "Honda", "BR-V", 2023, "White", 7, new Money(400_000m, "IDR"), businessId),
            Vehicle.Create("B 9012 GHI", "Suzuki", "Ertiga", 2022, "Black", 7, new Money(300_000m, "IDR"), businessId),
            Vehicle.Create("B 3456 JKL", "Toyota", "Fortuner", 2024, "Dark Blue", 7, new Money(800_000m, "IDR"), businessId),
            Vehicle.Create("B 7890 MNO", "Daihatsu", "Xenia", 2022, "White", 7, new Money(280_000m, "IDR"), businessId)
        );

        db.SaveChanges();
    }
}
