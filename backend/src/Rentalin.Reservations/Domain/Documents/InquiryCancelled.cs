using Rentalin.Core.Abstractions;

namespace Rentalin.Reservations.Domain.Documents;

public sealed record InquiryCancelled(Guid InquiryId, Guid CustomerId, Guid VehicleId, string? Reason) : DomainEventBase;
