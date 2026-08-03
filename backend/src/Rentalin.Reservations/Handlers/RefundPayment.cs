using MediatR;
using Rentalin.Core.Interfaces;
using Rentalin.Reservations.Contracts;
using Rentalin.Reservations.Domain.Entities;

namespace Rentalin.Reservations.Handlers;

public sealed class RefundPaymentHandler : IRequestHandler<RefundPaymentRequest, PaymentResponse>
{
    private readonly IRepository<Payment> _payments;
    private readonly IUnitOfWork _unitOfWork;

    public RefundPaymentHandler(IRepository<Payment> payments, IUnitOfWork unitOfWork)
    {
        _payments = payments;
        _unitOfWork = unitOfWork;
    }

    public async Task<PaymentResponse> Handle(RefundPaymentRequest request, CancellationToken ct)
    {
        var payment = await _payments.GetByIdAsync(request.PaymentId, ct)
            ?? throw new InvalidOperationException($"Payment {request.PaymentId} not found.");

        payment.Refund();
        _payments.Update(payment);
        await _unitOfWork.SaveChangesAsync(ct);

        return new PaymentResponse(
            payment.Id, payment.RentalId,
            payment.Amount.Amount, payment.Amount.Currency,
            payment.Method.ToString(), payment.Status.ToString(),
            payment.PaidAt);
    }
}
