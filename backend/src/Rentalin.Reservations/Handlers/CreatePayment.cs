using MediatR;
using Rentalin.Core.Interfaces;
using Rentalin.Core.ValueObjects;
using Rentalin.Reservations.Contracts;
using Rentalin.Reservations.Domain.Entities;
using Rentalin.Reservations.Domain.Enums;

namespace Rentalin.Reservations.Handlers;

public sealed class CreatePaymentHandler : IRequestHandler<CreatePaymentRequest, PaymentResponse>
{
    private readonly IRepository<Payment> _payments;
    private readonly IUnitOfWork _unitOfWork;

    public CreatePaymentHandler(IRepository<Payment> payments, IUnitOfWork unitOfWork)
    {
        _payments = payments;
        _unitOfWork = unitOfWork;
    }

    public async Task<PaymentResponse> Handle(CreatePaymentRequest request, CancellationToken ct)
    {
        var method = Enum.Parse<PaymentMethod>(request.Method);
        var amount = new Money(request.Amount, request.Currency);
        var payment = Payment.Create(request.RentalId, amount, method);

        _payments.Add(payment);
        await _unitOfWork.SaveChangesAsync(ct);

        return MapToResponse(payment);
    }

    private static PaymentResponse MapToResponse(Payment payment)
    {
        return new PaymentResponse(
            payment.Id, payment.RentalId, payment.Amount.Amount,
            payment.Amount.Currency, payment.Method.ToString(),
            payment.Status.ToString(), payment.PaidAt);
    }
}
