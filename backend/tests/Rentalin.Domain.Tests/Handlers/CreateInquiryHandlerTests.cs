using FluentAssertions;
using MediatR;
using NSubstitute;
using Rentalin.Core.Exceptions;
using Rentalin.Core.Interfaces;
using Rentalin.Core.ValueObjects;
using Rentalin.Fleet.Domain.Entities;
using Rentalin.Fleet.Domain.Enums;
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
    private readonly IRepository<Reservation> _reservations = Substitute.For<IRepository<Reservation>>();
    private readonly IUnitOfWork _unitOfWork = Substitute.For<IUnitOfWork>();
    private readonly CreateInquiryHandler _handler;

    public CreateInquiryHandlerTests()
    {
        var vehicle = Vehicle.Create("B TEST", "Toyota", "Avanza", 2023, "White", 7,
            Money.Zero("IDR"), Guid.NewGuid());
        _vehicles.GetByIdAsync(Arg.Any<Guid>(), Arg.Any<CancellationToken>()).Returns(vehicle);
        _reservations.GetAllAsync(Arg.Any<CancellationToken>()).Returns(new List<Reservation>().AsReadOnly());

        _handler = new CreateInquiryHandler(_inquiries, _customers, _vehicles, _reservations, _unitOfWork);
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

    [Fact]
    public async Task Handle_WithAvailableVehicleAndNoConflicts_ShouldCreateInquiry()
    {
        var start = DateTimeOffset.UtcNow.AddDays(1);
        var end = DateTimeOffset.UtcNow.AddDays(5);
        var vehicle = Vehicle.Create("B AVL", "Toyota", "Avanza", 2023, "White", 7,
            Money.Zero("IDR"), Guid.NewGuid());
        _vehicles.GetByIdAsync(Arg.Any<Guid>(), Arg.Any<CancellationToken>()).Returns(vehicle);
        _reservations.GetAllAsync(Arg.Any<CancellationToken>()).Returns(new List<Reservation>().AsReadOnly());

        var request = new CreateInquiryRequest(Guid.NewGuid(), vehicle.Id, start, end, null);

        var result = await _handler.Handle(request, CancellationToken.None);

        result.Status.Should().Be(InquiryStatus.Pending.ToString());
        result.StartDate.Should().Be(start);
        result.EndDate.Should().Be(end);
        _inquiries.Received(1).Add(Arg.Any<Inquiry>());
        await _unitOfWork.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_WithMaintenanceVehicle_ShouldThrowDomainException()
    {
        var vehicle = Vehicle.Create("B MTC", "Toyota", "Avanza", 2023, "White", 7,
            Money.Zero("IDR"), Guid.NewGuid());
        vehicle.UpdateStatus(VehicleStatus.Maintenance);
        _vehicles.GetByIdAsync(Arg.Any<Guid>(), Arg.Any<CancellationToken>()).Returns(vehicle);
        _reservations.GetAllAsync(Arg.Any<CancellationToken>()).Returns(new List<Reservation>().AsReadOnly());

        var request = new CreateInquiryRequest(Guid.NewGuid(), vehicle.Id,
            DateTimeOffset.UtcNow.AddDays(1), DateTimeOffset.UtcNow.AddDays(5), null);

        var act = () => _handler.Handle(request, CancellationToken.None);

        await act.Should().ThrowAsync<DomainException>()
            .WithMessage("Vehicle is not available for the requested dates.");
    }

    [Fact]
    public async Task Handle_WithOverlappingReservation_ShouldThrowDomainException()
    {
        var vehicle = Vehicle.Create("B OVL", "Toyota", "Avanza", 2023, "White", 7,
            Money.Zero("IDR"), Guid.NewGuid());
        var period = new DateRange(DateTimeOffset.UtcNow.AddDays(1), DateTimeOffset.UtcNow.AddDays(5));
        _vehicles.GetByIdAsync(Arg.Any<Guid>(), Arg.Any<CancellationToken>()).Returns(vehicle);

        var conflictingInquiry = Inquiry.Create(Guid.NewGuid(), vehicle.Id, period, null);
        conflictingInquiry.Confirm();
        var conflictingReservation = Reservation.CreateFromInquiry(conflictingInquiry, Money.Zero("IDR"));
        _reservations.GetAllAsync(Arg.Any<CancellationToken>()).Returns(
            new List<Reservation> { conflictingReservation }.AsReadOnly());

        var request = new CreateInquiryRequest(Guid.NewGuid(), vehicle.Id,
            DateTimeOffset.UtcNow.AddDays(1), DateTimeOffset.UtcNow.AddDays(5), null);

        var act = () => _handler.Handle(request, CancellationToken.None);

        await act.Should().ThrowAsync<DomainException>()
            .WithMessage("Vehicle is not available for the requested dates.");
    }
}
