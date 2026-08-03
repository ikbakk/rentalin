using MediatR;

namespace Rentalin.Reservations.Contracts;

public sealed record GetPaymentsRequest(Guid? RentalId = null) : IRequest<IReadOnlyList<PaymentResponse>>;
