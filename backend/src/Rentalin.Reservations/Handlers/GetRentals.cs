using MediatR;
using Rentalin.Core.Interfaces;
using Rentalin.Reservations.Contracts;
using Rentalin.Reservations.Domain.Entities;

namespace Rentalin.Reservations.Handlers;

public sealed class GetRentalsHandler : IRequestHandler<GetRentalsRequest, IReadOnlyList<RentalResponse>>
{
    private readonly IRepository<Rental> _rentals;

    public GetRentalsHandler(IRepository<Rental> rentals)
    {
        _rentals = rentals;
    }

    public async Task<IReadOnlyList<RentalResponse>> Handle(GetRentalsRequest request, CancellationToken ct)
    {
        var rentals = await _rentals.GetAllAsync(ct);
        return rentals.Select(r => new RentalResponse(
            r.Id, r.ReservationId, r.VehicleId, r.CustomerId,
            r.ActualStart, r.ActualEnd,
            r.OdometerStart, r.OdometerEnd,
            r.Status.ToString())).ToList();
    }
}
