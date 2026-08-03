using MediatR;
using Rentalin.Core.Interfaces;
using Rentalin.Reservations.Contracts;
using Rentalin.Reservations.Domain.Entities;

namespace Rentalin.Reservations.Handlers;

public sealed class GetPaymentsHandler : IRequestHandler<GetPaymentsRequest, IReadOnlyList<PaymentResponse>>
{
    private readonly IRepository<Payment> _payments;

    public GetPaymentsHandler(IRepository<Payment> payments)
    {
        _payments = payments;
    }

    public async Task<IReadOnlyList<PaymentResponse>> Handle(GetPaymentsRequest request, CancellationToken ct)
    {
        var payments = await _payments.GetAllAsync(ct);

        if (request.RentalId is not null)
        {
            payments = payments.Where(p => p.RentalId == request.RentalId.Value).ToList();
        }

        return payments.Select(p => new PaymentResponse(
            p.Id, p.RentalId, p.Amount.Amount, p.Amount.Currency,
            p.Method.ToString(), p.Status.ToString(), p.PaidAt)).ToList();
    }
}
