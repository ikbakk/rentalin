using MediatR;
using Rentalin.Core.Exceptions;
using Rentalin.Core.Interfaces;
using Rentalin.Reservations.Contracts;
using Rentalin.Reservations.Domain.Entities;

namespace Rentalin.Reservations.Handlers;

public sealed class CancelReservationHandler : IRequestHandler<CancelReservationRequest, ReservationResponse>
{
    private readonly IRepository<Reservation> _reservations;
    private readonly IUnitOfWork _unitOfWork;

    public CancelReservationHandler(IRepository<Reservation> reservations, IUnitOfWork unitOfWork)
    {
        _reservations = reservations;
        _unitOfWork = unitOfWork;
    }

    public async Task<ReservationResponse> Handle(CancelReservationRequest request, CancellationToken ct)
    {
        var reservation = await _reservations.GetByIdAsync(request.ReservationId, ct)
            ?? throw new DomainException($"Reservation {request.ReservationId} not found.");

        reservation.Cancel(request.Reason);

        _reservations.Update(reservation);
        await _unitOfWork.SaveChangesAsync(ct);

        return new ReservationResponse(
            reservation.Id, reservation.InquiryId, reservation.CustomerId, reservation.VehicleId,
            reservation.RentalPeriod.Start, reservation.RentalPeriod.End,
            reservation.EstimatedCost.Amount, reservation.EstimatedCost.Currency,
            reservation.Status.ToString());
    }
}
