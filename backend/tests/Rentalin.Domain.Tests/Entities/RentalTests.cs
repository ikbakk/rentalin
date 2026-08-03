using FluentAssertions;
using Rentalin.Core.Exceptions;
using Rentalin.Core.ValueObjects;
using Rentalin.Reservations.Domain.Entities;
using Rentalin.Reservations.Domain.Enums;

namespace Rentalin.Domain.Tests.Entities;

public sealed class RentalTests
{
    [Fact]
    public void CreateFromReservation_WhenReady_ShouldCreateActiveRental()
    {
        var reservation = CreateReadyReservation();

        var rental = Rental.CreateFromReservation(reservation);

        rental.Status.Should().Be(RentalStatus.Active);
        rental.ReservationId.Should().Be(reservation.Id);
        rental.VehicleId.Should().Be(reservation.VehicleId);
        rental.CustomerId.Should().Be(reservation.CustomerId);
    }

    [Fact]
    public void CreateFromReservation_WhenNotReady_ShouldThrow()
    {
        var reservation = CreateActiveReservation();

        var act = () => Rental.CreateFromReservation(reservation);

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("Only ready reservations can start a rental.");
    }

    [Fact]
    public void Start_WhenActive_ShouldSetOdometerAndStartTime()
    {
        var rental = CreateActiveRental();

        rental.Start(12500);

        rental.OdometerStart.Should().Be(12500);
        rental.ActualStart.Should().NotBeNull();
    }

    [Fact]
    public void Start_WhenNotActive_ShouldThrow()
    {
        var rental = CreateActiveRental();
        rental.Start(100);
        rental.Complete(200);

        var act = () => rental.Start(100);

        act.Should().Throw<DomainException>()
            .WithMessage("Rental is not active.");
    }

    [Fact]
    public void Complete_WhenActiveAndStarted_ShouldSetOdometerEndAndComplete()
    {
        var rental = CreateActiveRental();
        rental.Start(12500);

        rental.Complete(12800);

        rental.OdometerEnd.Should().Be(12800);
        rental.ActualEnd.Should().NotBeNull();
        rental.Status.Should().Be(RentalStatus.Completed);
    }

    [Fact]
    public void Complete_WhenNotStarted_ShouldThrow()
    {
        var rental = CreateActiveRental();

        var act = () => rental.Complete(12800);

        act.Should().Throw<DomainException>()
            .WithMessage("Cannot complete rental — rental not started.");
    }

    [Fact]
    public void Complete_WhenNotActive_ShouldThrow()
    {
        var rental = CreateActiveRental();
        rental.Start(12500);
        rental.Complete(12800);

        var act = () => rental.Complete(13000);

        act.Should().Throw<DomainException>()
            .WithMessage("Cannot complete rental — rental not active.");
    }

    [Fact]
    public void Complete_OdometerEndLessThanStart_ShouldThrow()
    {
        var rental = CreateActiveRental();
        rental.Start(12500);

        var act = () => rental.Complete(12000);

        act.Should().Throw<DomainException>()
            .WithMessage("Odometer end reading must be greater than or equal to start reading.");
    }

    [Fact]
    public void Complete_OdometerEndEqualToStart_ShouldSucceed()
    {
        var rental = CreateActiveRental();
        rental.Start(12500);

        rental.Complete(12500);

        rental.OdometerEnd.Should().Be(12500);
        rental.Status.Should().Be(RentalStatus.Completed);
    }

    private static Reservation CreateActiveReservation()
    {
        var inquiry = Inquiry.Create(Guid.NewGuid(), Guid.NewGuid(),
            new DateRange(DateTimeOffset.UtcNow, DateTimeOffset.UtcNow.AddDays(3)), null);
        inquiry.Confirm();
        return Reservation.CreateFromInquiry(inquiry, new Money(500_000m, "IDR"));
    }

    private static Reservation CreateReadyReservation()
    {
        var reservation = CreateActiveReservation();
        reservation.Prepare();
        reservation.ReadyForHandover();
        return reservation;
    }

    private static Rental CreateActiveRental()
    {
        var reservation = CreateReadyReservation();
        return Rental.CreateFromReservation(reservation);
    }
}
