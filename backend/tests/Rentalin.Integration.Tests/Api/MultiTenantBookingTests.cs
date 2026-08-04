using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using Rentalin.Core.ValueObjects;
using Rentalin.Fleet.Domain.Entities;
using Rentalin.Infrastructure.Data;

namespace Rentalin.Integration.Tests.Api;

public sealed class MultiTenantBookingTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly TestWebApplicationFactory _factory;

    public MultiTenantBookingTests(TestWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task CompleteMultiTenantBookingFlow()
    {
        // 1. Setup: Seed 2 businesses with vehicles directly via DbContext
        Business baliBusiness;
        Business jakartaBusiness;
        Guid baliVehicleId1, baliVehicleId2, baliVehicleId3;
        Guid jakartaVehicleId1, jakartaVehicleId2;

        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<RentalinDbContext>();

            // Clear seed data so we control all test data
            db.Inquiries.RemoveRange(db.Inquiries);
            db.Customers.RemoveRange(db.Customers);
            db.Vehicles.RemoveRange(db.Vehicles);
            db.Staff.RemoveRange(db.Staff);
            db.Businesses.RemoveRange(db.Businesses);
            await db.SaveChangesAsync();

            baliBusiness = Business.Create(
                "Bali Premium Rentals",
                "Jl. Sunset Road No. 88, Kuta",
                "+62-361-555-1234",
                "bali@premium-rentals.com");

            jakartaBusiness = Business.Create(
                "Jakarta City Car",
                "Jl. Sudirman No. 42, Jakarta Pusat",
                "+62-21-555-5678",
                "jakarta@citycar.com");

            db.Businesses.Add(baliBusiness);
            db.Businesses.Add(jakartaBusiness);
            await db.SaveChangesAsync();

            var baliVehicles = new[]
            {
                Vehicle.Create("B 1234 CD", "Toyota", "Avanza", 2024, "Silver", 7,
                    new Money(350000, "IDR"), baliBusiness.Id),
                Vehicle.Create("B 5678 EF", "Honda", "BR-V", 2023, "White", 7,
                    new Money(400000, "IDR"), baliBusiness.Id),
                Vehicle.Create("B 9012 GH", "Daihatsu", "Xenia", 2024, "Black", 7,
                    new Money(325000, "IDR"), baliBusiness.Id)
            };

            var jakartaVehicles = new[]
            {
                Vehicle.Create("B 3456 IJ", "Suzuki", "Ertiga", 2023, "Blue", 7,
                    new Money(300000, "IDR"), jakartaBusiness.Id),
                Vehicle.Create("B 7890 KL", "Toyota", "Innova", 2024, "Dark Gray", 7,
                    new Money(500000, "IDR"), jakartaBusiness.Id)
            };

            baliVehicleId1 = baliVehicles[0].Id;
            baliVehicleId2 = baliVehicles[1].Id;
            baliVehicleId3 = baliVehicles[2].Id;
            jakartaVehicleId1 = jakartaVehicles[0].Id;
            jakartaVehicleId2 = jakartaVehicles[1].Id;

            db.Vehicles.AddRange(baliVehicles);
            db.Vehicles.AddRange(jakartaVehicles);
            await db.SaveChangesAsync();
        }

        var client = _factory.CreateClient();

        // 2. GET /api/public/bali-premium-rentals → 200, response.name == "Bali Premium Rentals"
        // Assertion 1
        var bizResponse = await client.GetAsync("/api/public/bali-premium-rentals");
        bizResponse.StatusCode.Should().Be(System.Net.HttpStatusCode.OK);

        var bizJson = await bizResponse.Content.ReadFromJsonAsync<JsonElement>();
        bizJson.GetProperty("name").GetString().Should().Be("Bali Premium Rentals");

        // 3. GET /api/public/bali-premium-rentals/vehicles → 200, Array.Length == 3
        // Assertion 2
        var baliVehiclesResponse = await client.GetAsync("/api/public/bali-premium-rentals/vehicles");
        baliVehiclesResponse.StatusCode.Should().Be(System.Net.HttpStatusCode.OK);

        var baliVehiclesJson = await baliVehiclesResponse.Content.ReadFromJsonAsync<JsonElement>();
        baliVehiclesJson.GetArrayLength().Should().Be(3);

        // 4. GET /api/public/jakarta-city-car/vehicles → 200, Array.Length == 2
        // Assertion 3
        var jakartaVehiclesResponse = await client.GetAsync("/api/public/jakarta-city-car/vehicles");
        jakartaVehiclesResponse.StatusCode.Should().Be(System.Net.HttpStatusCode.OK);

        var jakartaVehiclesJson = await jakartaVehiclesResponse.Content.ReadFromJsonAsync<JsonElement>();
        jakartaVehiclesJson.GetArrayLength().Should().Be(2);

        // 5. POST /api/public/bali-premium-rentals/inquiries with a Bali vehicleId → 200
        // Assertion 4
        var inquiryPayload = new
        {
            vehicleId = baliVehicleId1,
            startDate = DateTimeOffset.UtcNow.AddDays(1).ToString("o"),
            endDate = DateTimeOffset.UtcNow.AddDays(3).ToString("o"),
            customerName = "Test Customer",
            customerPhone = "+62-812-3456-7890"
        };

        var inquiryResponse = await client.PostAsJsonAsync(
            "/api/public/bali-premium-rentals/inquiries", inquiryPayload);
        inquiryResponse.StatusCode.Should().Be(System.Net.HttpStatusCode.OK);

        // 6. POST /api/public/bali-premium-rentals/inquiries with a Jakarta vehicleId → 400
        // Assertion 5
        var crossBusinessPayload = new
        {
            vehicleId = jakartaVehicleId1,
            startDate = DateTimeOffset.UtcNow.AddDays(1).ToString("o"),
            endDate = DateTimeOffset.UtcNow.AddDays(3).ToString("o"),
            customerName = "Wrong Business Customer",
            customerPhone = "+62-812-9876-5432"
        };

        var crossBusinessResponse = await client.PostAsJsonAsync(
            "/api/public/bali-premium-rentals/inquiries", crossBusinessPayload);
        crossBusinessResponse.StatusCode.Should().Be(System.Net.HttpStatusCode.BadRequest);

        // 7. GET /api/public/nonexistent → 404
        // Assertion 6
        var notFoundResponse = await client.GetAsync("/api/public/nonexistent");
        notFoundResponse.StatusCode.Should().Be(System.Net.HttpStatusCode.NotFound);

        // Assertion 7: Verify slug is auto-generated correctly
        var bizJson2 = await client.GetFromJsonAsync<JsonElement>("/api/public/bali-premium-rentals");
        bizJson2.GetProperty("slug").GetString().Should().Be("bali-premium-rentals");
    }
}
