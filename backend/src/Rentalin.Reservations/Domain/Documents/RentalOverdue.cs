using Rentalin.Core.Abstractions;

namespace Rentalin.Reservations.Domain.Documents;

public sealed record RentalOverdue(Guid RentalId, Guid ReservationId, Guid VehicleId, DateTimeOffset ScheduledEnd, DateTimeOffset OccurredAt) : DomainEventBase;
