using FluentAssertions;
using NSubstitute;
using Rentalin.Core.Interfaces;
using Rentalin.Core.ValueObjects;
using Rentalin.Fleet.Domain.Entities;
using Rentalin.Fleet.Domain.Enums;
using Rentalin.Inspections.Domain.Entities;
using Rentalin.Inspections.Domain.Enums;
using Rentalin.Reservations.Domain.Documents;
using Rentalin.Reservations.Domain.Documents.Handlers;
using Rentalin.Timeline.Domain.Entities;

namespace Rentalin.Domain.Tests.Handlers;

public sealed class RentalCompletedDomainHandlerTests
{
    private readonly IRepository<Vehicle> _vehicles = Substitute.For<IRepository<Vehicle>>();
    private readonly IRepository<Inspection> _inspections = Substitute.For<IRepository<Inspection>>();
    private readonly IRepository<TimelineEntry> _timelineEntries = Substitute.For<IRepository<TimelineEntry>>();
    private readonly IUnitOfWork _unitOfWork = Substitute.For<IUnitOfWork>();
    private readonly RentalCompletedDomainHandler _handler;

    public RentalCompletedDomainHandlerTests()
    {
        _handler = new RentalCompletedDomainHandler(_vehicles, _inspections, _timelineEntries, _unitOfWork);
    }

    [Fact]
    public async Task Handle_ShouldUpdateVehicleStatusToAvailable()
    {
        var vehicle = CreateRentedVehicle();
        var notification = CreateRentalCompleted(vehicle.Id);
        _vehicles.GetByIdAsync(vehicle.Id).Returns(vehicle);

        await _handler.Handle(notification, CancellationToken.None);

        vehicle.Status.Should().Be(VehicleStatus.Available);
        _vehicles.Received(1).Update(vehicle);
    }

    [Fact]
    public async Task Handle_ShouldCreatePostRentalInspection()
    {
        var vehicle = CreateRentedVehicle();
        var notification = CreateRentalCompleted(vehicle.Id);
        _vehicles.GetByIdAsync(vehicle.Id).Returns(vehicle);

        await _handler.Handle(notification, CancellationToken.None);

        _inspections.Received(1).Add(Arg.Is<Inspection>(i =>
            i.VehicleId == notification.VehicleId &&
            i.RentalId == notification.RentalId &&
            i.Type == InspectionType.PostRental));
    }

    [Fact]
    public async Task Handle_ShouldCreateTimelineEntry()
    {
        var vehicle = CreateRentedVehicle();
        var notification = CreateRentalCompleted(vehicle.Id);
        _vehicles.GetByIdAsync(vehicle.Id).Returns(vehicle);

        await _handler.Handle(notification, CancellationToken.None);

        _timelineEntries.Received(1).Add(Arg.Is<TimelineEntry>(t =>
            t.ReferenceType == "Rental" &&
            t.ReferenceId == notification.RentalId &&
            t.EventType == "RentalCompleted"));
    }

    [Fact]
    public async Task Handle_ShouldSaveChangesOnce()
    {
        var vehicle = CreateRentedVehicle();
        var notification = CreateRentalCompleted(vehicle.Id);
        _vehicles.GetByIdAsync(vehicle.Id).Returns(vehicle);

        await _handler.Handle(notification, CancellationToken.None);

        await _unitOfWork.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    private static Vehicle CreateRentedVehicle()
    {
        var vehicle = Vehicle.Create("B TEST", "Toyota", "Avanza", 2023, "White", 7,
            Money.Zero("IDR"), Guid.NewGuid());
        vehicle.UpdateStatus(VehicleStatus.Rented);
        return vehicle;
    }

    private static RentalCompleted CreateRentalCompleted(Guid vehicleId) =>
        new(Guid.NewGuid(), Guid.NewGuid(), vehicleId, 5000, DateTimeOffset.UtcNow);
}
