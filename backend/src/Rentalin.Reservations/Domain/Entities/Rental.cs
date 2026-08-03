using Rentalin.Core.Abstractions;
using Rentalin.Core.Entities;
using Rentalin.Core.Exceptions;
using Rentalin.Core.ValueObjects;
using Rentalin.Reservations.Domain.Documents;
using Rentalin.Reservations.Domain.Enums;

namespace Rentalin.Reservations.Domain.Entities;

public sealed class Rental : AggregateRoot
{
    public Guid ReservationId { get; private set; }
    public Guid VehicleId { get; private set; }
    public Guid CustomerId { get; private set; }
    public DateTimeOffset? ActualStart { get; private set; }
    public DateTimeOffset? ActualEnd { get; private set; }
    public int? OdometerStart { get; private set; }
    public int? OdometerEnd { get; private set; }
    public RentalStatus Status { get; private set; }
    public List<RentalExtension> Extensions { get; private set; }

    private Rental()
    {
        Extensions = [];
    }

    public static Rental CreateFromReservation(Reservation reservation)
    {
        if (reservation.Status != ReservationStatus.Ready)
            throw new InvalidOperationException("Only ready reservations can start a rental.");

        return new Rental
        {
            Id = Guid.NewGuid(),
            ReservationId = reservation.Id,
            VehicleId = reservation.VehicleId,
            CustomerId = reservation.CustomerId,
            Status = RentalStatus.Active
        };
    }

    public void Start(int odometerStart)
    {
        if (Status != RentalStatus.Active)
            throw new DomainException("Rental is not active.");

        ActualStart = DateTimeOffset.UtcNow;
        OdometerStart = odometerStart;

        AddDomainEvent(new RentalStarted(Id, ReservationId, VehicleId, odometerStart, DateTimeOffset.UtcNow));
    }

    public void Reject(string reason)
    {
        if (Status != RentalStatus.Active)
            throw new DomainException("Can only reject an active rental.");

        Status = RentalStatus.Rejected;
        AddDomainEvent(new RentalRejected(Id, VehicleId, CustomerId, reason));
    }

    public void Complete(int odometerEnd)
    {
        if (Status != RentalStatus.Active)
            throw new DomainException("Cannot complete rental — rental not active.");

        if (OdometerStart is null)
            throw new DomainException("Cannot complete rental — rental not started.");

        if (odometerEnd < OdometerStart.Value)
            throw new DomainException("Odometer end reading must be greater than or equal to start reading.");

        ActualEnd = DateTimeOffset.UtcNow;
        OdometerEnd = odometerEnd;
        Status = RentalStatus.Completed;

        AddDomainEvent(new RentalCompleted(Id, ReservationId, VehicleId, odometerEnd, DateTimeOffset.UtcNow));
    }

    public void MarkOverdue(DateTimeOffset scheduledEnd)
    {
        if (Status != RentalStatus.Active)
            throw new DomainException("Cannot mark rental as overdue — rental is not active.");

        Status = RentalStatus.Overdue;
        AddDomainEvent(new RentalOverdue(Id, ReservationId, VehicleId, scheduledEnd, DateTimeOffset.UtcNow));
    }

    public void Extend(DateTimeOffset newEnd, Money additionalCost)
    {
        if (Status != RentalStatus.Active)
            throw new DomainException("Cannot extend rental — rental is not active.");

        if (newEnd <= DateTimeOffset.UtcNow)
            throw new DomainException("New end date must be in the future.");

        Extensions.Add(new RentalExtension(newEnd, additionalCost));
        AddDomainEvent(new RentalExtended(Id, ReservationId, VehicleId, newEnd, additionalCost.Amount, DateTimeOffset.UtcNow));
    }
}

public sealed class RentalExtension
{
    public Guid Id { get; private set; }
    public DateTimeOffset NewEnd { get; private set; }
    public Money AdditionalCost { get; private set; }

    private RentalExtension()
    {
        AdditionalCost = Money.Zero("IDR");
    }

    public RentalExtension(DateTimeOffset newEnd, Money additionalCost)
    {
        NewEnd = newEnd;
        AdditionalCost = additionalCost;
    }
}

