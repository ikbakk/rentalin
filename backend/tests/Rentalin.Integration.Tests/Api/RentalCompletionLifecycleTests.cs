using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using Rentalin.Api.Auth;
using Rentalin.Fleet.Contracts;
using Rentalin.Inspections.Contracts;
using Rentalin.Reservations.Contracts;

namespace Rentalin.Integration.Tests.Api;

public sealed class RentalCompletionLifecycleTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly HttpClient _client;
    private readonly JsonSerializerOptions _jsonOptions;

    public RentalCompletionLifecycleTests(TestWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
        _jsonOptions = new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        };
    }

    [Fact]
    public async Task CompleteRental_ShouldResetVehicleToAvailableAndCreatePostRentalInspection()
    {
        // ── 1. Login ──────────────────────────────────────────
        var loginResponse = await _client.PostAsJsonAsync("/api/auth/login", new
        {
            email = "admin@rentalin.com",
            password = "admin123"
        });
        loginResponse.EnsureSuccessStatusCode();
        var loginResult = await loginResponse.Content.ReadFromJsonAsync<LoginResponse>(_jsonOptions);
        _client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", loginResult!.Token);

        // ── 2. Create vehicle ─────────────────────────────────
        var vehicleResponse = await _client.PostAsJsonAsync("/api/vehicles", new
        {
            licensePlate = "B 9999 TST",
            make = "Toyota",
            model = "Avanza",
            year = 2023,
            color = "Silver",
            seatingCapacity = 7,
            dailyRate = 350_000m,
            currency = "IDR",
            businessId = loginResult.BusinessId.ToString()
        });
        vehicleResponse.EnsureSuccessStatusCode();
        var vehicle = await vehicleResponse.Content.ReadFromJsonAsync<VehicleResponse>(_jsonOptions);
        vehicle!.Status.Should().Be("Available");

        // ── 3. Create customer ────────────────────────────────
        var customerResponse = await _client.PostAsJsonAsync("/api/customers", new
        {
            name = "Test Customer",
            phoneNumber = "+62-812-0000-0000",
            email = "test@example.com",
            notes = (string?)null
        });
        customerResponse.EnsureSuccessStatusCode();
        var customer = await customerResponse.Content.ReadFromJsonAsync<CustomerResponse>(_jsonOptions);

        // ── 4. Create inquiry ─────────────────────────────────
        var inquiryResponse = await _client.PostAsJsonAsync("/api/inquiries", new
        {
            customerId = customer!.Id.ToString(),
            vehicleId = vehicle.Id.ToString(),
            startDate = DateTimeOffset.UtcNow.AddDays(1),
            endDate = DateTimeOffset.UtcNow.AddDays(3),
            notes = (string?)null
        });
        inquiryResponse.EnsureSuccessStatusCode();
        var inquiry = await inquiryResponse.Content.ReadFromJsonAsync<InquiryResponse>(_jsonOptions);

        // ── 5. Confirm inquiry ────────────────────────────────
        var confirmResponse = await _client.PostAsync($"/api/inquiries/{inquiry!.Id}/confirm", null);
        confirmResponse.EnsureSuccessStatusCode();

        // ── 6. Create reservation ─────────────────────────────
        var reservationResponse = await _client.PostAsJsonAsync("/api/reservations", new
        {
            inquiryId = inquiry.Id.ToString(),
            estimatedCost = 700_000m,
            currency = "IDR"
        });
        reservationResponse.EnsureSuccessStatusCode();
        var reservation = await reservationResponse.Content.ReadFromJsonAsync<ReservationResponse>(_jsonOptions);

        // ── 7. Prepare reservation ────────────────────────────
        var prepareResponse = await _client.PostAsync($"/api/reservations/{reservation!.Id}/prepare", null);
        prepareResponse.EnsureSuccessStatusCode();

        // ── 8. Ready for handover ─────────────────────────────
        var readyResponse = await _client.PostAsync($"/api/reservations/{reservation.Id}/ready-for-handover", null);
        readyResponse.EnsureSuccessStatusCode();

        // ── 9. Start rental ───────────────────────────────────
        var startRentalResponse = await _client.PostAsJsonAsync(
            $"/api/reservations/{reservation.Id}/start-rental", new
        {
            odometerStart = 10_000
        });
        startRentalResponse.EnsureSuccessStatusCode();
        var rental = await startRentalResponse.Content.ReadFromJsonAsync<RentalResponse>(_jsonOptions);
        var rentalId = rental!.Id;
        rental.Status.Should().Be("Active");

        // ── 10. Complete rental ────────────────────────────────
        var completeResponse = await _client.PostAsJsonAsync(
            $"/api/rentals/{rentalId}/complete", new
        {
            odometerEnd = 10_500
        });
        completeResponse.EnsureSuccessStatusCode();

        // ── 11. Assert vehicle status → Available ─────────────
        var getVehicleResponse = await _client.GetAsync($"/api/vehicles/{vehicle.Id}");
        getVehicleResponse.EnsureSuccessStatusCode();
        var updatedVehicle = await getVehicleResponse.Content
            .ReadFromJsonAsync<VehicleResponse>(_jsonOptions);
        updatedVehicle!.Status.Should().Be("Available");

        // ── 12. Assert PostRental inspection created ──────────
        var inspectionsResponse = await _client.GetAsync("/api/inspections");
        inspectionsResponse.EnsureSuccessStatusCode();
        var inspections = await inspectionsResponse.Content
            .ReadFromJsonAsync<List<InspectionResponse>>(_jsonOptions);
        inspections.Should().Contain(i =>
            i.Type == "PostRental" &&
            i.Status == "Pending" &&
            i.RentalId == rental.Id);
    }
}
