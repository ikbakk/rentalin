using FluentAssertions;
using Rentalin.Core.Exceptions;
using Rentalin.Core.ValueObjects;
using Rentalin.Fleet.Domain.Entities;
using Rentalin.Fleet.Domain.Enums;

namespace Rentalin.Domain.Tests.Entities;

public sealed class VehicleTests
{
    [Fact]
    public void Create_WithValidParameters_ShouldCreateVehicleInAvailableState()
    {
        var dailyRate = new Money(350_000m, "IDR");
        var businessId = Guid.NewGuid();

        var vehicle = Vehicle.Create("B 1234 ABC", "Toyota", "Avanza", 2023, "Silver", 7, dailyRate, businessId);

        vehicle.LicensePlate.Should().Be("B 1234 ABC");
        vehicle.Make.Should().Be("Toyota");
        vehicle.Model.Should().Be("Avanza");
        vehicle.Year.Should().Be(2023);
        vehicle.Color.Should().Be("Silver");
        vehicle.SeatingCapacity.Should().Be(7);
        vehicle.DailyRate.Should().Be(dailyRate);
        vehicle.Status.Should().Be(VehicleStatus.Available);
        vehicle.BusinessId.Should().Be(businessId);
    }

    [Fact]
    public void Create_ShouldHaveNonEmptyId()
    {
        var vehicle = Vehicle.Create("B 1234", "Toyota", "Avanza", 2023, "White", 5,
            Money.Zero("IDR"), Guid.NewGuid());

        vehicle.Id.Should().NotBeEmpty();
    }

    [Fact]
    public void Update_ShouldChangeAllProperties()
    {
        var vehicle = CreateValidVehicle();
        var newRate = new Money(500_000m, "IDR");
        var newBusinessId = Guid.NewGuid();

        vehicle.Update("B 9999", "Honda", "Jazz", 2024, "Blue", 5, newRate, newBusinessId);

        vehicle.LicensePlate.Should().Be("B 9999");
        vehicle.Make.Should().Be("Honda");
        vehicle.Model.Should().Be("Jazz");
        vehicle.Year.Should().Be(2024);
        vehicle.Color.Should().Be("Blue");
        vehicle.SeatingCapacity.Should().Be(5);
        vehicle.DailyRate.Should().Be(newRate);
        vehicle.BusinessId.Should().Be(newBusinessId);
    }

    // ── Legal transitions ──────────────────────────────────────────

    public static IEnumerable<object[]> LegalTransitionData =>
        new List<object[]>
        {
            new object[] { VehicleStatus.Available, VehicleStatus.Rented },
            new object[] { VehicleStatus.Available, VehicleStatus.Maintenance },
            new object[] { VehicleStatus.Available, VehicleStatus.Retired },
            new object[] { VehicleStatus.Rented, VehicleStatus.Available },
            new object[] { VehicleStatus.Rented, VehicleStatus.Retired },
            new object[] { VehicleStatus.Maintenance, VehicleStatus.Available },
            new object[] { VehicleStatus.Maintenance, VehicleStatus.Retired },
        };

    [Theory]
    [MemberData(nameof(LegalTransitionData))]
    public void UpdateStatus_LegalTransition_ShouldSucceed(VehicleStatus from, VehicleStatus to)
    {
        var vehicle = CreateVehicleWithStatus(from);

        vehicle.UpdateStatus(to);

        vehicle.Status.Should().Be(to);
    }

    // ── Illegal transitions ────────────────────────────────────────

    public static IEnumerable<object[]> IllegalTransitionData =>
        new List<object[]>
        {
            new object[] { VehicleStatus.Available, VehicleStatus.Available },
            new object[] { VehicleStatus.Rented, VehicleStatus.Maintenance },
            new object[] { VehicleStatus.Rented, VehicleStatus.Rented },
            new object[] { VehicleStatus.Maintenance, VehicleStatus.Rented },
            new object[] { VehicleStatus.Maintenance, VehicleStatus.Maintenance },
            new object[] { VehicleStatus.Retired, VehicleStatus.Available },
            new object[] { VehicleStatus.Retired, VehicleStatus.Rented },
            new object[] { VehicleStatus.Retired, VehicleStatus.Maintenance },
            new object[] { VehicleStatus.Retired, VehicleStatus.Retired },
        };

    [Theory]
    [MemberData(nameof(IllegalTransitionData))]
    public void UpdateStatus_IllegalTransition_ShouldThrowDomainException(VehicleStatus from, VehicleStatus to)
    {
        var vehicle = CreateVehicleWithStatus(from);

        var act = () => vehicle.UpdateStatus(to);

        act.Should().Throw<DomainException>();
    }

    // ── Helpers ────────────────────────────────────────────────────

    private static Vehicle CreateVehicleWithStatus(VehicleStatus status)
    {
        var vehicle = Vehicle.Create("B 1234", "Toyota", "Avanza", 2023, "White", 7,
            new Money(350_000m, "IDR"), Guid.NewGuid());

        if (status != VehicleStatus.Available)
            vehicle.UpdateStatus(status);

        return vehicle;
    }

    private static Vehicle CreateValidVehicle() =>
        Vehicle.Create("B 1234", "Toyota", "Avanza", 2023, "White", 7,
            new Money(350_000m, "IDR"), Guid.NewGuid());
}
