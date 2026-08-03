using MediatR;
using Rentalin.Core.Interfaces;
using Rentalin.Reservations.Contracts;
using Rentalin.Reservations.Domain.Entities;

namespace Rentalin.Reservations.Handlers;

public sealed class GetReservationsHandler : IRequestHandler<GetReservationsRequest, IReadOnlyList<ReservationResponse>>
{
    private readonly IRepository<Reservation> _reservations;

    public GetReservationsHandler(IRepository<Reservation> reservations)
    {
        _reservations = reservations;
    }

    public async Task<IReadOnlyList<ReservationResponse>> Handle(GetReservationsRequest request, CancellationToken ct)
    {
        var reservations = await _reservations.GetAllAsync(ct);
        return reservations.Select(r => new ReservationResponse(
            r.Id, r.InquiryId, r.CustomerId, r.VehicleId,
            r.RentalPeriod.Start, r.RentalPeriod.End,
            r.EstimatedCost.Amount, r.EstimatedCost.Currency,
            r.Status.ToString())).ToList();
    }
}
