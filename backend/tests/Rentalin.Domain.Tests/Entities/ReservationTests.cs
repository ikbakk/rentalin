using FluentAssertions;
using Rentalin.Core.Exceptions;
using Rentalin.Core.ValueObjects;
using Rentalin.Reservations.Domain.Entities;
using Rentalin.Reservations.Domain.Enums;

namespace Rentalin.Domain.Tests.Entities;

public sealed class ReservationTests
{
    [Fact]
    public void CreateFromInquiry_WhenConfirmed_ShouldCreateActiveReservation()
    {
        var inquiry = CreateConfirmedInquiry();

        var reservation = Reservation.CreateFromInquiry(inquiry, new Money(500_000m, "IDR"));

        reservation.Status.Should().Be(ReservationStatus.Active);
        reservation.InquiryId.Should().Be(inquiry.Id);
        reservation.CustomerId.Should().Be(inquiry.CustomerId);
        reservation.VehicleId.Should().Be(inquiry.VehicleId);
        reservation.RentalPeriod.Should().Be(inquiry.RentalPeriod);
        reservation.EstimatedCost.Should().Be(new Money(500_000m, "IDR"));
    }

    [Fact]
    public void CreateFromInquiry_WhenPending_ShouldThrow()
    {
        var inquiry = CreatePendingInquiry();

        var act = () => Reservation.CreateFromInquiry(inquiry, Money.Zero("IDR"));

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("Cannot create reservation from unconfirmed inquiry.");
    }

    [Fact]
    public void CreateFromInquiry_WhenRejected_ShouldThrow()
    {
        var inquiry = CreatePendingInquiry();
        inquiry.Cancel();

        var act = () => Reservation.CreateFromInquiry(inquiry, Money.Zero("IDR"));

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("Cannot create reservation from unconfirmed inquiry.");
    }

    [Fact]
    public void Prepare_WhenActive_ShouldTransitionToPreparing()
    {
        var reservation = CreateActiveReservation();

        reservation.Prepare();

        reservation.Status.Should().Be(ReservationStatus.Preparing);
    }

    [Fact]
    public void Prepare_WhenNotActive_ShouldThrow()
    {
        var reservation = CreateActiveReservation();
        reservation.Prepare();

        var act = () => reservation.Prepare();

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("Only active reservations can be prepared.");
    }

    [Fact]
    public void ReadyForHandover_WhenPreparing_ShouldTransitionToReady()
    {
        var reservation = CreateActiveReservation();
        reservation.Prepare();

        reservation.ReadyForHandover();

        reservation.Status.Should().Be(ReservationStatus.Ready);
    }

    [Fact]
    public void ReadyForHandover_WhenNotPreparing_ShouldThrow()
    {
        var reservation = CreateActiveReservation();

        var act = () => reservation.ReadyForHandover();

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("Only preparing reservations can be marked ready.");
    }

    [Fact]
    public void HandoverComplete_WhenReady_ShouldTransitionToInProgress()
    {
        var reservation = CreateActiveReservation();
        reservation.Prepare();
        reservation.ReadyForHandover();

        reservation.HandoverComplete();

        reservation.Status.Should().Be(ReservationStatus.InProgress);
    }

    [Fact]
    public void HandoverComplete_WhenNotReady_ShouldThrow()
    {
        var reservation = CreateActiveReservation();

        var act = () => reservation.HandoverComplete();

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("Only ready reservations can complete handover.");
    }

    [Fact]
    public void StartRental_WhenReady_ShouldNotThrow()
    {
        var reservation = CreateActiveReservation();
        reservation.Prepare();
        reservation.ReadyForHandover();

        var act = () => reservation.StartRental();

        act.Should().NotThrow();
    }

    [Fact]
    public void StartRental_WhenNotReady_ShouldThrow()
    {
        var reservation = CreateActiveReservation();

        var act = () => reservation.StartRental();

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("Only ready reservations can start a rental.");
    }

    [Fact]
    public void Cancel_WhenActive_ShouldTransitionToCancelled()
    {
        var reservation = CreateActiveReservation();

        reservation.Cancel();

        reservation.Status.Should().Be(ReservationStatus.Cancelled);
    }

    [Fact]
    public void Cancel_WhenPreparing_ShouldTransitionToCancelled()
    {
        var reservation = CreateActiveReservation();
        reservation.Prepare();

        reservation.Cancel();

        reservation.Status.Should().Be(ReservationStatus.Cancelled);
    }

    [Fact]
    public void Cancel_WhenReady_ShouldTransitionToCancelled()
    {
        var reservation = CreateActiveReservation();
        reservation.Prepare();
        reservation.ReadyForHandover();

        reservation.Cancel();

        reservation.Status.Should().Be(ReservationStatus.Cancelled);
    }

    [Fact]
    public void Cancel_WhenInProgress_ShouldThrow()
    {
        var reservation = CreateActiveReservation();
        reservation.Prepare();
        reservation.ReadyForHandover();
        reservation.HandoverComplete();

        var act = () => reservation.Cancel();

        act.Should().Throw<DomainException>()
            .WithMessage("Cannot cancel a completed or in-progress reservation.");
    }

    [Fact]
    public void Cancel_WhenCompleted_ShouldThrow()
    {
        var reservation = CreateActiveReservation();
        typeof(Reservation).GetProperty("Status")!.SetValue(reservation, ReservationStatus.Completed);

        var act = () => reservation.Cancel();

        act.Should().Throw<DomainException>()
            .WithMessage("Cannot cancel a completed or in-progress reservation.");
    }

    [Fact]
    public void Cancel_WhenAlreadyCancelled_ShouldCancel()
    {
        var reservation = CreateActiveReservation();
        reservation.Cancel();

        reservation.Cancel();

        reservation.Status.Should().Be(ReservationStatus.Cancelled);
    }

    private static Inquiry CreatePendingInquiry() =>
        Inquiry.Create(Guid.NewGuid(), Guid.NewGuid(),
            new DateRange(DateTimeOffset.UtcNow, DateTimeOffset.UtcNow.AddDays(3)), null);

    private static Inquiry CreateConfirmedInquiry()
    {
        var inquiry = CreatePendingInquiry();
        inquiry.Confirm();
        return inquiry;
    }

    private static Reservation CreateActiveReservation()
    {
        var inquiry = CreateConfirmedInquiry();
        return Reservation.CreateFromInquiry(inquiry, new Money(500_000m, "IDR"));
    }
}
