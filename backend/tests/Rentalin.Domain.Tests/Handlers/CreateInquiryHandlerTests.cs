using FluentAssertions;
using MediatR;
using NSubstitute;
using Rentalin.Core.Interfaces;
using Rentalin.Core.ValueObjects;
using Rentalin.Fleet.Domain.Entities;
using Rentalin.Reservations.Contracts;
using Rentalin.Reservations.Domain.Entities;
using Rentalin.Reservations.Domain.Enums;
using Rentalin.Reservations.Handlers;

namespace Rentalin.Domain.Tests.Handlers;

public sealed class CreateInquiryHandlerTests
{
    private readonly IRepository<Inquiry> _inquiries = Substitute.For<IRepository<Inquiry>>();
    private readonly IRepository<Customer> _customers = Substitute.For<IRepository<Customer>>();
    private readonly IRepository<Vehicle> _vehicles = Substitute.For<IRepository<Vehicle>>();
    private readonly IUnitOfWork _unitOfWork = Substitute.For<IUnitOfWork>();
    private readonly CreateInquiryHandler _handler;

    public CreateInquiryHandlerTests()
    {
        _handler = new CreateInquiryHandler(_inquiries, _customers, _vehicles, _unitOfWork);
    }

    [Fact]
    public async Task Handle_WithExistingCustomerId_ShouldCreateInquiry()
    {
        var customerId = Guid.NewGuid();
        var vehicleId = Guid.NewGuid();
        var request = new CreateInquiryRequest(customerId, vehicleId,
            DateTimeOffset.UtcNow.AddDays(1), DateTimeOffset.UtcNow.AddDays(5), null);

        var result = await _handler.Handle(request, CancellationToken.None);

        result.Status.Should().Be(InquiryStatus.Pending.ToString());
        result.CustomerId.Should().Be(customerId);
        result.VehicleId.Should().Be(vehicleId);
        _inquiries.Received(1).Add(Arg.Any<Inquiry>());
        await _unitOfWork.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_WithNewCustomerName_ShouldCreateCustomerThenInquiry()
    {
        var vehicleId = Guid.NewGuid();
        var request = new CreateInquiryRequest(null, vehicleId,
            DateTimeOffset.UtcNow.AddDays(1), DateTimeOffset.UtcNow.AddDays(5),
            null, "John Doe", "+62-812-0000");

        var result = await _handler.Handle(request, CancellationToken.None);

        result.Status.Should().Be(InquiryStatus.Pending.ToString());
        result.VehicleId.Should().Be(vehicleId);
        _customers.Received(1).Add(Arg.Any<Customer>());
        await _unitOfWork.Received(2).SaveChangesAsync(Arg.Any<CancellationToken>());
        _inquiries.Received(1).Add(Arg.Any<Inquiry>());
    }

    [Fact]
    public async Task Handle_WithNotes_ShouldStoreNotes()
    {
        var request = new CreateInquiryRequest(Guid.NewGuid(), Guid.NewGuid(),
            DateTimeOffset.UtcNow.AddDays(1), DateTimeOffset.UtcNow.AddDays(5),
            "Special request", null, null);

        var result = await _handler.Handle(request, CancellationToken.None);

        result.Notes.Should().Be("Special request");
    }

    [Fact]
    public async Task Handle_WithoutCustomerIdOrName_ShouldThrow()
    {
        var request = new CreateInquiryRequest(null, Guid.NewGuid(),
            DateTimeOffset.UtcNow.AddDays(1), DateTimeOffset.UtcNow.AddDays(5),
            null, null, null);

        var act = () => _handler.Handle(request, CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("CustomerId or CustomerName is required");
    }

    [Fact]
    public async Task Handle_ShouldReturnCorrectDates()
    {
        var start = DateTimeOffset.UtcNow.AddDays(1);
        var end = DateTimeOffset.UtcNow.AddDays(5);
        var request = new CreateInquiryRequest(Guid.NewGuid(), Guid.NewGuid(),
            start, end, null);

        var result = await _handler.Handle(request, CancellationToken.None);

        result.StartDate.Should().Be(start);
        result.EndDate.Should().Be(end);
    }
}
