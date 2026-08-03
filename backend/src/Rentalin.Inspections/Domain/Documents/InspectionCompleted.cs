using Rentalin.Core.Abstractions;

namespace Rentalin.Inspections.Domain.Documents;

public sealed record InspectionCompleted(Guid InspectionId, Guid VehicleId, DateTimeOffset OccurredAt) : DomainEventBase;
