using Rentalin.Core.Abstractions;

namespace Rentalin.Reservations.Domain.Documents;

public sealed record RentalExtended(Guid RentalId, Guid ReservationId, Guid VehicleId, DateTimeOffset NewEnd, decimal AdditionalCost, DateTimeOffset OccurredAt) : DomainEventBase;
