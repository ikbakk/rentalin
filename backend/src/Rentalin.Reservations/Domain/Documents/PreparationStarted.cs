using Rentalin.Core.Abstractions;

namespace Rentalin.Reservations.Domain.Documents;

public sealed record PreparationStarted(Guid ReservationId, Guid VehicleId, DateTimeOffset OccurredAt) : DomainEventBase;
