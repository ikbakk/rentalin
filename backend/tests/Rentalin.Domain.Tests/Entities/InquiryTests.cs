using FluentAssertions;
using Rentalin.Core.Exceptions;
using Rentalin.Core.ValueObjects;
using Rentalin.Reservations.Domain.Entities;
using Rentalin.Reservations.Domain.Enums;

namespace Rentalin.Domain.Tests.Entities;

public sealed class InquiryTests
{
    [Fact]
    public void Create_ShouldSetPendingStatus()
    {
        var inquiry = CreatePendingInquiry();

        inquiry.Status.Should().Be(InquiryStatus.Pending);
    }

    [Fact]
    public void Create_ShouldStoreCustomerAndVehicleAndPeriod()
    {
        var customerId = Guid.NewGuid();
        var vehicleId = Guid.NewGuid();
        var period = new DateRange(DateTimeOffset.UtcNow, DateTimeOffset.UtcNow.AddDays(3));

        var inquiry = Inquiry.Create(customerId, vehicleId, period, null);

        inquiry.CustomerId.Should().Be(customerId);
        inquiry.VehicleId.Should().Be(vehicleId);
        inquiry.RentalPeriod.Should().Be(period);
    }

    [Fact]
    public void Create_ShouldStoreNotes()
    {
        var inquiry = Inquiry.Create(Guid.NewGuid(), Guid.NewGuid(),
            new DateRange(DateTimeOffset.UtcNow, DateTimeOffset.UtcNow.AddDays(3)), "Test notes");

        inquiry.Notes.Should().Be("Test notes");
    }

    [Fact]
    public void Confirm_WhenPending_ShouldChangeStatusToConfirmed()
    {
        var inquiry = CreatePendingInquiry();

        inquiry.Confirm();

        inquiry.Status.Should().Be(InquiryStatus.Confirmed);
    }

    [Fact]
    public void Confirm_WhenAlreadyConfirmed_ShouldThrow()
    {
        var inquiry = CreatePendingInquiry();
        inquiry.Confirm();

        var act = () => inquiry.Confirm();

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("Only pending inquiries can be confirmed.");
    }

    [Fact]
    public void Confirm_WhenRejected_ShouldThrow()
    {
        var inquiry = CreatePendingInquiry();
        inquiry.Cancel();

        var act = () => inquiry.Confirm();

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("Only pending inquiries can be confirmed.");
    }

    [Fact]
    public void Cancel_WhenPending_ShouldChangeStatusToRejected()
    {
        var inquiry = CreatePendingInquiry();

        inquiry.Cancel();

        inquiry.Status.Should().Be(InquiryStatus.Rejected);
    }

    [Fact]
    public void Cancel_WhenAlreadyConfirmed_ShouldThrow()
    {
        var inquiry = CreatePendingInquiry();
        inquiry.Confirm();

        var act = () => inquiry.Cancel();

        act.Should().Throw<DomainException>()
            .WithMessage("Only pending inquiries can be cancelled.");
    }

    [Fact]
    public void Cancel_WhenAlreadyRejected_ShouldThrow()
    {
        var inquiry = CreatePendingInquiry();
        inquiry.Cancel();

        var act = () => inquiry.Cancel();

        act.Should().Throw<DomainException>()
            .WithMessage("Only pending inquiries can be cancelled.");
    }

    private static Inquiry CreatePendingInquiry() =>
        Inquiry.Create(Guid.NewGuid(), Guid.NewGuid(),
            new DateRange(DateTimeOffset.UtcNow, DateTimeOffset.UtcNow.AddDays(5)), null);
}
