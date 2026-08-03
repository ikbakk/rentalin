using MediatR;

namespace Rentalin.Reservations.Contracts;

public sealed record CreateInquiryRequest(
    Guid? CustomerId,
    Guid VehicleId,
    DateTimeOffset StartDate,
    DateTimeOffset EndDate,
    string? Notes,
    string? CustomerName = null,
    string? CustomerPhone = null) : IRequest<InquiryResponse>;
