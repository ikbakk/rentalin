using Rentalin.Core.Abstractions;

namespace Rentalin.Reservations.Domain.Documents;

public sealed record RentalCompleted(Guid RentalId, Guid ReservationId, Guid VehicleId, int OdometerEnd, DateTimeOffset OccurredAt) : DomainEventBase;
