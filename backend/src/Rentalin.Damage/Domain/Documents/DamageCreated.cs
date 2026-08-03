using Rentalin.Core.Abstractions;

namespace Rentalin.Damage.Domain.Documents;

public sealed record DamageCreated(
    Guid DamageId,
    Guid RentalId,
    Guid VehicleId,
    string Description,
    string Severity,
    DateTimeOffset OccurredAt) : DomainEventBase;
