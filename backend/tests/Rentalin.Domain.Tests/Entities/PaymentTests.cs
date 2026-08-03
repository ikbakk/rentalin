using FluentAssertions;
using Rentalin.Core.ValueObjects;
using Rentalin.Reservations.Domain.Entities;
using Rentalin.Reservations.Domain.Enums;

namespace Rentalin.Domain.Tests.Entities;

public sealed class PaymentTests
{
    [Fact]
    public void Create_ShouldSetPendingStatus()
    {
        var payment = Payment.Create(Guid.NewGuid(), new Money(500_000m, "IDR"), PaymentMethod.Cash);

        payment.Status.Should().Be(PaymentStatus.Pending);
    }

    [Fact]
    public void Create_ShouldStoreProperties()
    {
        var rentalId = Guid.NewGuid();
        var amount = new Money(750_000m, "IDR");

        var payment = Payment.Create(rentalId, amount, PaymentMethod.CreditCard);

        payment.RentalId.Should().Be(rentalId);
        payment.Amount.Should().Be(amount);
        payment.Method.Should().Be(PaymentMethod.CreditCard);
    }

    [Fact]
    public void Create_BankTransferMethod_ShouldSucceed()
    {
        var payment = Payment.Create(Guid.NewGuid(), new Money(100_000m, "IDR"), PaymentMethod.BankTransfer);

        payment.Method.Should().Be(PaymentMethod.BankTransfer);
    }

    [Fact]
    public void MarkComplete_WhenPending_ShouldTransitionToCompletedAndSetPaidAt()
    {
        var payment = Payment.Create(Guid.NewGuid(), new Money(500_000m, "IDR"), PaymentMethod.Cash);

        payment.MarkComplete();

        payment.Status.Should().Be(PaymentStatus.Completed);
        payment.PaidAt.Should().NotBeNull();
    }

    [Fact]
    public void MarkComplete_WhenAlreadyCompleted_ShouldThrow()
    {
        var payment = Payment.Create(Guid.NewGuid(), new Money(500_000m, "IDR"), PaymentMethod.Cash);
        payment.MarkComplete();

        var act = () => payment.MarkComplete();

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("Only pending payments can be marked as completed.");
    }
}
