using Rentalin.Core.Entities;
using Rentalin.Core.Exceptions;
using Rentalin.Core.ValueObjects;
using Rentalin.Reservations.Domain.Documents;
using Rentalin.Reservations.Domain.Enums;

namespace Rentalin.Reservations.Domain.Entities;

public sealed class Reservation : AggregateRoot
{
    public Guid InquiryId { get; private set; }
    public Guid CustomerId { get; private set; }
    public Guid VehicleId { get; private set; }
    public DateRange RentalPeriod { get; private set; }
    public Money EstimatedCost { get; private set; }
    public ReservationStatus Status { get; private set; }

    private Reservation()
    {
        RentalPeriod = new DateRange(DateTimeOffset.UtcNow, DateTimeOffset.UtcNow.AddDays(1));
        EstimatedCost = Money.Zero("USD");
    }

    public static Reservation CreateFromInquiry(Inquiry inquiry, Money estimatedCost)
    {
        if (inquiry.Status != InquiryStatus.Confirmed)
            throw new InvalidOperationException("Cannot create reservation from unconfirmed inquiry.");

        var reservation = new Reservation
        {
            Id = Guid.NewGuid(),
            InquiryId = inquiry.Id,
            CustomerId = inquiry.CustomerId,
            VehicleId = inquiry.VehicleId,
            RentalPeriod = inquiry.RentalPeriod,
            EstimatedCost = estimatedCost,
            Status = ReservationStatus.Active
        };

        reservation.AddDomainEvent(new ReservationCreated(reservation.Id, inquiry.Id,
            inquiry.CustomerId, inquiry.VehicleId, DateTimeOffset.UtcNow));
        return reservation;
    }

    public void Prepare()
    {
        if (Status != ReservationStatus.Active)
            throw new InvalidOperationException("Only active reservations can be prepared.");

        Status = ReservationStatus.Preparing;
        AddDomainEvent(new PreparationStarted(Id, VehicleId, DateTimeOffset.UtcNow));
    }

    public void ReadyForHandover()
    {
        if (Status != ReservationStatus.Preparing)
            throw new InvalidOperationException("Only preparing reservations can be marked ready.");

        Status = ReservationStatus.Ready;
        AddDomainEvent(new ReadyForHandover(Id, VehicleId, DateTimeOffset.UtcNow));
    }

    public void HandoverComplete()
    {
        if (Status != ReservationStatus.Ready)
            throw new InvalidOperationException("Only ready reservations can complete handover.");

        Status = ReservationStatus.InProgress;
        AddDomainEvent(new HandoverCompleted(Id, VehicleId, DateTimeOffset.UtcNow));
    }

    public void StartRental()
    {
        if (Status != ReservationStatus.Ready)
            throw new InvalidOperationException("Only ready reservations can start a rental.");
    }

    public void Cancel(string? reason = null)
    {
        if (Status is ReservationStatus.Completed or ReservationStatus.InProgress)
            throw new DomainException("Cannot cancel a completed or in-progress reservation.");

        Status = ReservationStatus.Cancelled;
        AddDomainEvent(new ReservationCancelled(Id, VehicleId, reason));
    }
}
