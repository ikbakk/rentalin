using System.Net.Http.Json;
using FluentAssertions;

namespace Rentalin.Integration.Tests.Api;

public sealed class ReservationFlowTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly HttpClient _client;

    public ReservationFlowTests(TestWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task InquiryEndpoints_ShouldReturnOkForGet()
    {
        var response = await _client.GetAsync("/api/inquiries");

        response.StatusCode.Should().Be(System.Net.HttpStatusCode.OK);
    }

    [Fact]
    public async Task ReservationEndpoints_ShouldReturnOkForGet()
    {
        var response = await _client.GetAsync("/api/reservations");

        response.StatusCode.Should().Be(System.Net.HttpStatusCode.OK);
    }

    [Fact]
    public async Task RentalEndpoints_ShouldReturnOkForGet()
    {
        var response = await _client.GetAsync("/api/rentals");

        response.StatusCode.Should().Be(System.Net.HttpStatusCode.OK);
    }

    [Fact]
    public async Task PaymentEndpoints_ShouldReturnOkForGet()
    {
        var response = await _client.GetAsync("/api/payments");

        response.StatusCode.Should().Be(System.Net.HttpStatusCode.OK);
    }

    [Fact]
    public async Task InspectionEndpoints_ShouldBeAccessible()
    {
        var response = await _client.GetAsync("/api/inspections");

        response.StatusCode.Should().NotBe(System.Net.HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task TimelineEndpoints_ShouldReturnOkForGet()
    {
        var response = await _client.GetAsync("/api/timeline");

        response.StatusCode.Should().Be(System.Net.HttpStatusCode.OK);
    }

    [Fact]
    public async Task CustomerEndpoints_ShouldReturnOkForGet()
    {
        var response = await _client.GetAsync("/api/customers");

        response.StatusCode.Should().Be(System.Net.HttpStatusCode.OK);
    }

    [Fact]
    public async Task OperationsEndpoints_ShouldReturnOkForGet()
    {
        var response = await _client.GetAsync("/api/operations/summary");

        response.StatusCode.Should().Be(System.Net.HttpStatusCode.OK);
    }

    [Fact]
    public async Task BusinessesEndpoints_ShouldReturnOkForGet()
    {
        var response = await _client.GetAsync("/api/businesses");

        response.StatusCode.Should().Be(System.Net.HttpStatusCode.OK);
    }

    [Fact]
    public async Task StaffEndpoints_ShouldReturnOkForGet()
    {
        var response = await _client.GetAsync("/api/staff");

        response.StatusCode.Should().Be(System.Net.HttpStatusCode.OK);
    }
}
