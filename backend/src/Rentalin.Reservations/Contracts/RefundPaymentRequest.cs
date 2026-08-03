using MediatR;

namespace Rentalin.Reservations.Contracts;

public sealed record RefundPaymentRequest(Guid PaymentId) : IRequest<PaymentResponse>;
