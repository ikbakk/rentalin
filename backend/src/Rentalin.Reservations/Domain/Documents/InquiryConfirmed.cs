using Rentalin.Core.Abstractions;

namespace Rentalin.Reservations.Domain.Documents;

public sealed record InquiryConfirmed(Guid InquiryId, DateTimeOffset OccurredAt) : DomainEventBase;
