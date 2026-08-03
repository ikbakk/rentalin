using Rentalin.Core.Abstractions;

namespace Rentalin.Reservations.Domain.Documents;

public sealed record ReservationCancelled(Guid ReservationId, Guid VehicleId, string? Reason) : DomainEventBase;
