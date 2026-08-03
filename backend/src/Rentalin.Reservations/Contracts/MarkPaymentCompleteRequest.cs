using MediatR;

namespace Rentalin.Reservations.Contracts;

public sealed record MarkPaymentCompleteRequest(Guid PaymentId) : IRequest<PaymentResponse>;
