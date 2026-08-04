using FluentAssertions;
using Rentalin.Core.ValueObjects;
using Rentalin.Fleet.Domain.Entities;
using Rentalin.Fleet.Domain.Enums;
using Rentalin.Reservations.Domain.Entities;
using Rentalin.Reservations.Domain.Enums;
using Rentalin.Reservations.Domain.Services;

namespace Rentalin.Domain.Tests.Services;

public sealed class VehicleAvailabilityServiceTests
{
    private readonly VehicleAvailabilityService _service = new();
    private readonly Guid _businessId = Guid.NewGuid();

    [Fact]
    public void IsAvailable_AvailableVehicle_ShouldReturnTrue()
    {
        var vehicle = CreateVehicle(VehicleStatus.Available);
        var period = CreateDateRange();

        var result = _service.IsAvailable(vehicle, period, []);

        result.Should().BeTrue();
    }

    [Fact]
    public void IsAvailable_MaintenanceVehicle_ShouldReturnFalse()
    {
        var vehicle = CreateVehicle(VehicleStatus.Maintenance);
        var period = CreateDateRange();

        var result = _service.IsAvailable(vehicle, period, []);

        result.Should().BeFalse();
    }

    [Fact]
    public void IsAvailable_RetiredVehicle_ShouldReturnFalse()
    {
        var vehicle = CreateVehicle(VehicleStatus.Retired);
        var period = CreateDateRange();

        var result = _service.IsAvailable(vehicle, period, []);

        result.Should().BeFalse();
    }

    [Fact]
    public void IsAvailable_OverlappingReservation_ShouldReturnFalse()
    {
        var vehicle = CreateVehicle(VehicleStatus.Available);
        var period = CreateDateRange();
        var existingReservation = CreateReservation(vehicle.Id, VehicleStatus.Available, period);

        var result = _service.IsAvailable(vehicle, period, [existingReservation]);

        result.Should().BeFalse();
    }

    [Fact]
    public void IsAvailable_NonOverlappingReservation_ShouldReturnTrue()
    {
        var vehicle = CreateVehicle(VehicleStatus.Available);
        var period = CreateDateRange();
        var nonOverlappingPeriod = new DateRange(
            period.End.AddDays(1), period.End.AddDays(5));
        var existingReservation = CreateReservation(vehicle.Id, VehicleStatus.Available, nonOverlappingPeriod);

        var result = _service.IsAvailable(vehicle, period, [existingReservation]);

        result.Should().BeTrue();
    }

    [Fact]
    public void IsAvailable_CancelledReservationIgnored_ShouldReturnTrue()
    {
        var vehicle = CreateVehicle(VehicleStatus.Available);
        var period = CreateDateRange();
        var cancelledReservation = CreateReservation(vehicle.Id, VehicleStatus.Available, period);
        typeof(Reservation).GetProperty("Status")!.SetValue(cancelledReservation, ReservationStatus.Cancelled);

        var result = _service.IsAvailable(vehicle, period, [cancelledReservation]);

        result.Should().BeTrue();
    }

    [Fact]
    public void IsAvailable_DifferentVehicleReservation_ShouldReturnTrue()
    {
        var vehicle = CreateVehicle(VehicleStatus.Available);
        var period = CreateDateRange();
        var reservationForOtherVehicle = CreateReservation(Guid.NewGuid(), VehicleStatus.Available, period);

        var result = _service.IsAvailable(vehicle, period, [reservationForOtherVehicle]);

        result.Should().BeTrue();
    }

    [Fact]
    public void IsAvailable_RentedVehicle_ShouldReturnTrue()
    {
        var vehicle = CreateVehicle(VehicleStatus.Rented);
        var period = CreateDateRange();

        var result = _service.IsAvailable(vehicle, period, []);

        result.Should().BeTrue();
    }

    private Vehicle CreateVehicle(VehicleStatus status)
    {
        var vehicle = Vehicle.Create("B TEST", "Make", "Model", 2023, "Color", 5,
            Money.Zero("IDR"), _businessId);
        if (status != VehicleStatus.Available)
            vehicle.UpdateStatus(status);
        return vehicle;
    }

    private static DateRange CreateDateRange() =>
        new(DateTimeOffset.UtcNow.AddDays(1), DateTimeOffset.UtcNow.AddDays(5));

    private static Reservation CreateReservation(Guid vehicleId, VehicleStatus vehicleStatus, DateRange period)
    {
        var vehicle = Vehicle.Create("B TEMP", "Make", "Model", 2023, "Color", 5,
            Money.Zero("IDR"), Guid.NewGuid());
        if (vehicleStatus != VehicleStatus.Available)
            vehicle.UpdateStatus(vehicleStatus);
        var inquiry = Inquiry.Create(Guid.NewGuid(), vehicleId, period, null);
        inquiry.Confirm();
        return Reservation.CreateFromInquiry(inquiry, Money.Zero("IDR"));
    }
}
