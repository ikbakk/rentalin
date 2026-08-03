using MediatR;
using Rentalin.Core.Interfaces;
using Rentalin.Reservations.Contracts;
using Rentalin.Reservations.Domain.Entities;

namespace Rentalin.Reservations.Handlers;

public sealed class ExtendRentalHandler : IRequestHandler<ExtendRentalRequest, RentalResponse>
{
    private readonly IRepository<Rental> _rentals;
    private readonly IUnitOfWork _unitOfWork;

    public ExtendRentalHandler(IRepository<Rental> rentals, IUnitOfWork unitOfWork)
    {
        _rentals = rentals;
        _unitOfWork = unitOfWork;
    }

    public async Task<RentalResponse> Handle(ExtendRentalRequest request, CancellationToken ct)
    {
        var rental = await _rentals.GetByIdAsync(request.RentalId, ct)
            ?? throw new InvalidOperationException($"Rental {request.RentalId} not found.");

        var additionalCost = new Core.ValueObjects.Money(request.AdditionalAmount, request.Currency);
        rental.Extend(request.NewEnd, additionalCost);
        _rentals.Update(rental);
        await _unitOfWork.SaveChangesAsync(ct);

        return new RentalResponse(
            rental.Id, rental.ReservationId, rental.VehicleId, rental.CustomerId,
            rental.ActualStart, rental.ActualEnd,
            rental.OdometerStart, rental.OdometerEnd,
            rental.Status.ToString());
    }
}
