using Rentalin.Core.Abstractions;

namespace Rentalin.Maintenance.Domain.Documents;

public sealed record MaintenanceScheduled(
    Guid MaintenanceId,
    Guid VehicleId,
    string Type,
    DateTimeOffset ScheduledStart,
    DateTimeOffset OccurredAt) : DomainEventBase;
