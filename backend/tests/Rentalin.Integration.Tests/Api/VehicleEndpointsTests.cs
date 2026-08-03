using System.Net.Http.Json;
using FluentAssertions;
using Rentalin.Fleet.Contracts;

namespace Rentalin.Integration.Tests.Api;

public sealed class VehicleEndpointsTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly HttpClient _client;

    public VehicleEndpointsTests(TestWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task GetVehicles_WithoutAuth_ShouldReturn200()
    {
        var response = await _client.GetAsync("/api/vehicles");

        response.StatusCode.Should().Be(System.Net.HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetVehicles_ShouldReturnList()
    {
        var response = await _client.GetAsync("/api/vehicles");
        response.StatusCode.Should().Be(System.Net.HttpStatusCode.OK);
        var body = await response.Content.ReadAsStringAsync();
        body.Should().NotBeNullOrEmpty();
    }

    [Fact]
    public async Task CreateVehicle_WithoutAuth_ShouldReturn401()
    {
        var response = await _client.PostAsJsonAsync("/api/vehicles", new
        {
            licensePlate = "B 9999 TST",
            make = "Honda",
            model = "Jazz",
            year = 2024,
            color = "Red",
            seatingCapacity = 5,
            dailyRate = 300_000m,
            currency = "IDR",
            businessId = Guid.NewGuid().ToString()
        });

        response.StatusCode.Should().Be(System.Net.HttpStatusCode.Unauthorized);
    }
}
