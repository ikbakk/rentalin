using MediatR;

namespace Rentalin.Reservations.Contracts;

public sealed record CreatePaymentRequest(
    Guid RentalId,
    decimal Amount,
    string Currency,
    string Method) : IRequest<PaymentResponse>;
