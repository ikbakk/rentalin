using Rentalin.Core.Abstractions;

namespace Rentalin.Damage.Domain.Documents;

public sealed record DamageResolved(
    Guid DamageId,
    Guid RentalId,
    Guid VehicleId,
    string ResolutionNotes,
    DateTimeOffset OccurredAt) : DomainEventBase;
