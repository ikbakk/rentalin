using Rentalin.Core.Entities;
using Rentalin.Core.ValueObjects;
using Rentalin.Reservations.Domain.Enums;

namespace Rentalin.Reservations.Domain.Entities;

public sealed class Payment : AggregateRoot
{
    public Guid RentalId { get; private set; }
    public Money Amount { get; private set; }
    public PaymentMethod Method { get; private set; }
    public PaymentStatus Status { get; private set; }
    public DateTimeOffset? PaidAt { get; private set; }

    private Payment()
    {
        Amount = Money.Zero("USD");
    }

    public static Payment Create(Guid rentalId, Money amount, PaymentMethod method)
    {
        return new Payment
        {
            Id = Guid.NewGuid(),
            RentalId = rentalId,
            Amount = amount,
            Method = method,
            Status = PaymentStatus.Pending
        };
    }

    public void MarkComplete()
    {
        if (Status != PaymentStatus.Pending)
            throw new InvalidOperationException("Only pending payments can be marked as completed.");

        Status = PaymentStatus.Completed;
        PaidAt = DateTimeOffset.UtcNow;
    }

    public void Refund()
    {
        if (Status != PaymentStatus.Completed)
            throw new InvalidOperationException("Only completed payments can be refunded.");

        Status = PaymentStatus.Refunded;
    }
}
