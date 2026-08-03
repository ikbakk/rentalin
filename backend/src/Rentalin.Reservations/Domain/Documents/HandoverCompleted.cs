using Rentalin.Core.Abstractions;

namespace Rentalin.Reservations.Domain.Documents;

public sealed record HandoverCompleted(Guid ReservationId, Guid VehicleId, DateTimeOffset OccurredAt) : DomainEventBase;
