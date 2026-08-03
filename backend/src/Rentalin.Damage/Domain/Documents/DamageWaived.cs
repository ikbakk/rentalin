using Rentalin.Core.Abstractions;

namespace Rentalin.Damage.Domain.Documents;

public sealed record DamageWaived(
    Guid DamageId,
    Guid RentalId,
    Guid VehicleId,
    string Reason,
    DateTimeOffset OccurredAt) : DomainEventBase;
