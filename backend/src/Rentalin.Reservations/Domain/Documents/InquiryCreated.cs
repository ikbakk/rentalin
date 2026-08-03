using Rentalin.Core.Abstractions;

namespace Rentalin.Reservations.Domain.Documents;

public sealed record InquiryCreated(Guid InquiryId, Guid CustomerId, Guid VehicleId, DateTimeOffset OccurredAt) : DomainEventBase;
