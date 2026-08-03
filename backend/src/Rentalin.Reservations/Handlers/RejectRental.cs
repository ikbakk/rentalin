using MediatR;
using Rentalin.Core.Exceptions;
using Rentalin.Core.Interfaces;
using Rentalin.Reservations.Contracts;
using Rentalin.Reservations.Domain.Entities;

namespace Rentalin.Reservations.Handlers;

public sealed class RejectRentalHandler : IRequestHandler<RejectRentalRequest, RentalResponse>
{
    private readonly IRepository<Rental> _rentals;
    private readonly IUnitOfWork _unitOfWork;

    public RejectRentalHandler(IRepository<Rental> rentals, IUnitOfWork unitOfWork)
    {
        _rentals = rentals;
        _unitOfWork = unitOfWork;
    }

    public async Task<RentalResponse> Handle(RejectRentalRequest request, CancellationToken ct)
    {
        var rental = await _rentals.GetByIdAsync(request.RentalId, ct)
            ?? throw new DomainException($"Rental {request.RentalId} not found.");

        rental.Reject(request.Reason);

        _rentals.Update(rental);
        await _unitOfWork.SaveChangesAsync(ct);

        return new RentalResponse(
            rental.Id, rental.ReservationId, rental.VehicleId, rental.CustomerId,
            rental.ActualStart, rental.ActualEnd,
            rental.OdometerStart, rental.OdometerEnd,
            rental.Status.ToString());
    }
}
