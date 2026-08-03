using Rentalin.Core.Entities;
using Rentalin.Core.Exceptions;
using Rentalin.Core.ValueObjects;
using Rentalin.Reservations.Domain.Documents;
using Rentalin.Reservations.Domain.Enums;

namespace Rentalin.Reservations.Domain.Entities;

public sealed class Inquiry : AggregateRoot
{
    public Guid CustomerId { get; private set; }
    public Guid VehicleId { get; private set; }
    public DateRange RentalPeriod { get; private set; }
    public InquiryStatus Status { get; private set; }
    public string? Notes { get; private set; }

    private Inquiry()
    {
        RentalPeriod = new DateRange(DateTimeOffset.UtcNow, DateTimeOffset.UtcNow.AddDays(1));
    }

    public static Inquiry Create(Guid customerId, Guid vehicleId, DateRange rentalPeriod, string? notes)
    {
        var inquiry = new Inquiry
        {
            Id = Guid.NewGuid(),
            CustomerId = customerId,
            VehicleId = vehicleId,
            RentalPeriod = rentalPeriod,
            Status = InquiryStatus.Pending,
            Notes = notes
        };

        inquiry.AddDomainEvent(new InquiryCreated(inquiry.Id, customerId, vehicleId, DateTimeOffset.UtcNow));
        return inquiry;
    }

    public void Confirm()
    {
        if (Status != InquiryStatus.Pending)
            throw new InvalidOperationException("Only pending inquiries can be confirmed.");

        Status = InquiryStatus.Confirmed;
        AddDomainEvent(new InquiryConfirmed(Id, DateTimeOffset.UtcNow));
    }

    public void Cancel(string? reason = null)
    {
        if (Status != InquiryStatus.Pending)
            throw new DomainException("Only pending inquiries can be cancelled.");

        Status = InquiryStatus.Rejected;
        AddDomainEvent(new InquiryCancelled(Id, CustomerId, VehicleId, reason));
    }
}
