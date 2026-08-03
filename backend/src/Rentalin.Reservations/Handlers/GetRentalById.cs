using MediatR;
using Rentalin.Core.Interfaces;
using Rentalin.Reservations.Contracts;
using Rentalin.Reservations.Domain.Entities;

namespace Rentalin.Reservations.Handlers;

public sealed class GetRentalByIdHandler : IRequestHandler<GetRentalByIdRequest, RentalResponse>
{
    private readonly IRepository<Rental> _rentals;

    public GetRentalByIdHandler(IRepository<Rental> rentals)
    {
        _rentals = rentals;
    }

    public async Task<RentalResponse> Handle(GetRentalByIdRequest request, CancellationToken ct)
    {
        var rental = await _rentals.GetByIdAsync(request.Id, ct)
            ?? throw new InvalidOperationException($"Rental {request.Id} not found.");

        return new RentalResponse(
            rental.Id, rental.ReservationId, rental.VehicleId, rental.CustomerId,
            rental.ActualStart, rental.ActualEnd,
            rental.OdometerStart, rental.OdometerEnd,
            rental.Status.ToString());
    }
}
