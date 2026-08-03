using Rentalin.Core.Abstractions;

namespace Rentalin.Reservations.Domain.Documents;

public sealed record RentalRejected(Guid RentalId, Guid VehicleId, Guid CustomerId, string Reason) : DomainEventBase;
