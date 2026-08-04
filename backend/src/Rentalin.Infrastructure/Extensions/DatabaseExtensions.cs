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
            db.Businesses.AddRange(
                Business.Create("Bali Premium Rentals", "Jl. Raya Kuta No.88, Bali", "+62-361-5555-8888", "bali@rentalin.com"),
                Business.Create("Jakarta City Car", "Jl. Thamrin No.15, Jakarta", "+62-21-6666-7777", "jakarta@rentalin.com")
            );
            db.SaveChanges();
        }

        var baliBusinessId = db.Businesses.Single(b => b.Email == "bali@rentalin.com").Id;
        var jakartaBusinessId = db.Businesses.Single(b => b.Email == "jakarta@rentalin.com").Id;

        if (!db.Staff.Any())
        {
            var baliAdmin = Staff.Create("Admin Owner", "admin@bali-premium.com", "+62-361-5555-8888", "Owner", baliBusinessId);
            baliAdmin.SetPassword("admin123");

            var jakartaAdmin = Staff.Create("Admin Owner", "admin@jakarta-city.com", "+62-21-6666-7777", "Owner", jakartaBusinessId);
            jakartaAdmin.SetPassword("admin123");

            db.Staff.AddRange(baliAdmin, jakartaAdmin);
            db.SaveChanges();
        }

        if (!db.Customers.Any())
        {
            db.Customers.AddRange(
                Customer.Create("Wayan Sudarma", "wayan@email.com", "+62-812-1111-2222", "Bali repeat customer"),
                Customer.Create("Andi Prasetyo", "andi@email.com", "+62-813-3333-4444", "Jakarta corporate customer")
            );
            db.SaveChanges();
        }

        if (!db.Vehicles.Any())
        {
            db.Vehicles.AddRange(
                Vehicle.Create("B 1234 ABC", "Toyota", "Avanza", 2023, "Silver", 7, new Money(350_000m, "IDR"), baliBusinessId),
                Vehicle.Create("B 5678 DEF", "Honda", "BR-V", 2023, "White", 7, new Money(400_000m, "IDR"), baliBusinessId),
                Vehicle.Create("B 9012 GHI", "Suzuki", "Ertiga", 2022, "Black", 7, new Money(300_000m, "IDR"), baliBusinessId),
                Vehicle.Create("B 3456 JKL", "Toyota", "Fortuner", 2024, "Dark Blue", 7, new Money(800_000m, "IDR"), jakartaBusinessId),
                Vehicle.Create("B 7890 MNO", "Daihatsu", "Xenia", 2022, "White", 7, new Money(280_000m, "IDR"), jakartaBusinessId)
            );
            db.SaveChanges();
        }

        if (!db.Inquiries.Any())
        {
            var wayan = db.Customers.Single(c => c.Email == "wayan@email.com");
            var andi = db.Customers.Single(c => c.Email == "andi@email.com");
            var avanza = db.Vehicles.Single(v => v.LicensePlate == "B 1234 ABC");
            var fortuner = db.Vehicles.Single(v => v.LicensePlate == "B 3456 JKL");

            db.Inquiries.AddRange(
                Inquiry.Create(wayan.Id, avanza.Id,
                    new DateRange(DateTimeOffset.UtcNow.AddDays(1), DateTimeOffset.UtcNow.AddDays(3)),
                    "Wayan wants the Avanza for a weekend trip around Bali."),
                Inquiry.Create(andi.Id, fortuner.Id,
                    new DateRange(DateTimeOffset.UtcNow.AddDays(1), DateTimeOffset.UtcNow.AddDays(3)),
                    "Andi wants the Fortuner for a family trip to Bandung.")
            );
            db.SaveChanges();
        }
    }
}
