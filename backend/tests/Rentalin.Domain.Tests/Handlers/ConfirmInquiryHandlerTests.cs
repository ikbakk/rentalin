using FluentAssertions;
using NSubstitute;
using Rentalin.Core.Exceptions;
using Rentalin.Core.Interfaces;
using Rentalin.Core.ValueObjects;
using Rentalin.Fleet.Domain.Entities;
using Rentalin.Reservations.Contracts;
using Rentalin.Reservations.Domain.Entities;
using Rentalin.Reservations.Domain.Enums;
using Rentalin.Reservations.Handlers;

namespace Rentalin.Domain.Tests.Handlers;

public sealed class ConfirmInquiryHandlerTests
{
    private readonly IRepository<Inquiry> _inquiries = Substitute.For<IRepository<Inquiry>>();
    private readonly IRepository<Vehicle> _vehicles = Substitute.For<IRepository<Vehicle>>();
    private readonly IRepository<Reservation> _reservations = Substitute.For<IRepository<Reservation>>();
    private readonly IRepository<Customer> _customers = Substitute.For<IRepository<Customer>>();
    private readonly IUnitOfWork _unitOfWork = Substitute.For<IUnitOfWork>();
    private readonly ConfirmInquiryHandler _handler;

    public ConfirmInquiryHandlerTests()
    {
        _handler = new ConfirmInquiryHandler(_inquiries, _vehicles, _reservations, _customers, _unitOfWork);
    }

    [Fact]
    public async Task Handle_WhenVehicleAvailable_ShouldConfirmInquiry()
    {
        var vehicle = Vehicle.Create("B TEST", "Toyota", "Avanza", 2023, "White", 7,
            Money.Zero("IDR"), Guid.NewGuid());
        var inquiry = Inquiry.Create(Guid.NewGuid(), vehicle.Id,
            new DateRange(DateTimeOffset.UtcNow.AddDays(1), DateTimeOffset.UtcNow.AddDays(5)), null);
        _inquiries.GetByIdAsync(inquiry.Id).Returns(inquiry);
        _vehicles.GetByIdAsync(vehicle.Id).Returns(vehicle);
        _reservations.GetAllAsync(Arg.Any<CancellationToken>()).Returns(new List<Reservation>().AsReadOnly());

        var result = await _handler.Handle(new ConfirmInquiryRequest(inquiry.Id), CancellationToken.None);

        result.Status.Should().Be(InquiryStatus.Confirmed.ToString());
        _inquiries.Received(1).Update(inquiry);
        await _unitOfWork.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_WhenInquiryNotFound_ShouldThrow()
    {
        _inquiries.GetByIdAsync(Arg.Any<Guid>()).Returns((Inquiry?)null);

        var act = () => _handler.Handle(new ConfirmInquiryRequest(Guid.NewGuid()), CancellationToken.None);

        await act.Should().ThrowAsync<DomainException>()
            .WithMessage("*not found*");
    }

    [Fact]
    public async Task Handle_WhenVehicleNotFound_ShouldThrow()
    {
        var inquiry = CreatePendingInquiry();
        _inquiries.GetByIdAsync(inquiry.Id).Returns(inquiry);
        _vehicles.GetByIdAsync(inquiry.VehicleId).Returns((Vehicle?)null);

        var act = () => _handler.Handle(new ConfirmInquiryRequest(inquiry.Id), CancellationToken.None);

        await act.Should().ThrowAsync<DomainException>()
            .WithMessage("Vehicle not found.");
    }

    [Fact]
    public async Task Handle_WhenVehicleNotAvailable_ShouldThrow()
    {
        var vehicle = Vehicle.Create("B MTC", "Toyota", "Avanza", 2023, "White", 7,
            Money.Zero("IDR"), Guid.NewGuid());
        vehicle.UpdateStatus(Fleet.Domain.Enums.VehicleStatus.Maintenance);
        var inquiry = Inquiry.Create(Guid.NewGuid(), vehicle.Id,
            new DateRange(DateTimeOffset.UtcNow.AddDays(1), DateTimeOffset.UtcNow.AddDays(5)), null);
        _inquiries.GetByIdAsync(inquiry.Id).Returns(inquiry);
        _vehicles.GetByIdAsync(vehicle.Id).Returns(vehicle);
        _reservations.GetAllAsync(Arg.Any<CancellationToken>()).Returns(new List<Reservation>().AsReadOnly());

        var act = () => _handler.Handle(new ConfirmInquiryRequest(inquiry.Id), CancellationToken.None);

        await act.Should().ThrowAsync<DomainException>()
            .WithMessage("Vehicle already reserved for these dates.");
    }

    [Fact]
    public async Task Handle_WhenOverlappingReservation_ShouldThrow()
    {
        var vehicle = Vehicle.Create("B TEST", "Toyota", "Avanza", 2023, "White", 7,
            Money.Zero("IDR"), Guid.NewGuid());
        var period = new DateRange(DateTimeOffset.UtcNow.AddDays(1), DateTimeOffset.UtcNow.AddDays(5));
        var inquiry = Inquiry.Create(Guid.NewGuid(), vehicle.Id, period, null);
        _inquiries.GetByIdAsync(inquiry.Id).Returns(inquiry);
        _vehicles.GetByIdAsync(vehicle.Id).Returns(vehicle);
        var existing = CreateConfirmedInquiryExec(vehicle.Id, period);
        var existingReservation = Reservation.CreateFromInquiry(existing, Money.Zero("IDR"));
        _reservations.GetAllAsync(Arg.Any<CancellationToken>()).Returns(
            new List<Reservation> { existingReservation }.AsReadOnly());

        var act = () => _handler.Handle(new ConfirmInquiryRequest(inquiry.Id), CancellationToken.None);

        await act.Should().ThrowAsync<DomainException>()
            .WithMessage("Vehicle already reserved for these dates.");
    }

    private static Inquiry CreatePendingInquiry() =>
        Inquiry.Create(Guid.NewGuid(), Guid.NewGuid(),
            new DateRange(DateTimeOffset.UtcNow.AddDays(1), DateTimeOffset.UtcNow.AddDays(5)), null);

    private static Inquiry CreateConfirmedInquiryExec(Guid vehicleId, DateRange period)
    {
        var inquiry = Inquiry.Create(Guid.NewGuid(), vehicleId, period, null);
        inquiry.Confirm();
        return inquiry;
    }
}
