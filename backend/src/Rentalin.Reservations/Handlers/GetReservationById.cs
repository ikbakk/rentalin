using MediatR;
using Rentalin.Core.Interfaces;
using Rentalin.Reservations.Contracts;
using Rentalin.Reservations.Domain.Entities;

namespace Rentalin.Reservations.Handlers;

public sealed class GetReservationByIdHandler : IRequestHandler<GetReservationByIdRequest, ReservationResponse>
{
    private readonly IRepository<Reservation> _reservations;

    public GetReservationByIdHandler(IRepository<Reservation> reservations)
    {
        _reservations = reservations;
    }

    public async Task<ReservationResponse> Handle(GetReservationByIdRequest request, CancellationToken ct)
    {
        var reservation = await _reservations.GetByIdAsync(request.Id, ct)
            ?? throw new InvalidOperationException($"Reservation {request.Id} not found.");

        return new ReservationResponse(
            reservation.Id, reservation.InquiryId, reservation.CustomerId, reservation.VehicleId,
            reservation.RentalPeriod.Start, reservation.RentalPeriod.End,
            reservation.EstimatedCost.Amount, reservation.EstimatedCost.Currency,
            reservation.Status.ToString());
    }
}
