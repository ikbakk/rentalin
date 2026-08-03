using Rentalin.Core.Abstractions;

namespace Rentalin.Reservations.Domain.Documents;

public sealed record RentalStarted(Guid RentalId, Guid ReservationId, Guid VehicleId, int OdometerStart, DateTimeOffset OccurredAt) : DomainEventBase;
