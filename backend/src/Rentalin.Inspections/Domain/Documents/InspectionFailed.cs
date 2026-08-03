using Rentalin.Core.Abstractions;

namespace Rentalin.Inspections.Domain.Documents;

public sealed record InspectionFailed(Guid InspectionId, Guid VehicleId, string Reason, DateTimeOffset OccurredAt) : DomainEventBase;
