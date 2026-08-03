using Rentalin.Core.Abstractions;

namespace Rentalin.Maintenance.Domain.Documents;

public sealed record MaintenanceCancelled(
    Guid MaintenanceId,
    Guid VehicleId,
    string Reason,
    DateTimeOffset OccurredAt) : DomainEventBase;
