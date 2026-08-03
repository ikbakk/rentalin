using Rentalin.Core.Abstractions;

namespace Rentalin.Maintenance.Domain.Documents;

public sealed record MaintenanceCompleted(
    Guid MaintenanceId,
    Guid VehicleId,
    DateTimeOffset OccurredAt) : DomainEventBase;
