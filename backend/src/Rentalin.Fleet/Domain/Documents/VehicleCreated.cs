using Rentalin.Core.Abstractions;

namespace Rentalin.Fleet.Domain.Documents;

public sealed record VehicleCreated(Guid VehicleId, string LicensePlate, DateTimeOffset OccurredAt) : DomainEventBase;
