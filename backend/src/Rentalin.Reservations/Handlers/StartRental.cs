using MediatR;
using Rentalin.Core.Exceptions;
using Rentalin.Core.Interfaces;
using Rentalin.Fleet.Domain.Entities;
using Rentalin.Fleet.Domain.Enums;
using Rentalin.Reservations.Contracts;
using Rentalin.Reservations.Domain.Entities;
using Rentalin.Reservations.Domain.Enums;

namespace Rentalin.Reservations.Handlers;

public sealed class StartRentalHandler : IRequestHandler<StartRentalRequest, RentalResponse>
{
    private readonly IRepository<Reservation> _reservations;
    private readonly IRepository<Rental> _rentals;
    private readonly IRepository<Vehicle> _vehicles;
    private readonly IUnitOfWork _unitOfWork;

    public StartRentalHandler(
        IRepository<Reservation> reservations,
        IRepository<Rental> rentals,
        IRepository<Vehicle> vehicles,
        IUnitOfWork unitOfWork)
    {
        _reservations = reservations;
        _rentals = rentals;
        _vehicles = vehicles;
        _unitOfWork = unitOfWork;
    }

    public async Task<RentalResponse> Handle(StartRentalRequest request, CancellationToken ct)
    {
        var reservation = await _reservations.GetByIdAsync(request.ReservationId, ct)
            ?? throw new DomainException($"Reservation {request.ReservationId} not found.");

        if (reservation.Status != ReservationStatus.Ready)
            throw new DomainException("Cannot start rental — reservation not ready.");

        var vehicle = await _vehicles.GetByIdAsync(reservation.VehicleId, ct)
            ?? throw new DomainException("Vehicle not found.");

        if (vehicle.Status is VehicleStatus.Maintenance or VehicleStatus.Retired)
            throw new DomainException("Vehicle is in maintenance.");

        var activeRentals = await _rentals.GetAllAsync(ct);
        var hasActiveRental = activeRentals.Any(r =>
            r.VehicleId == vehicle.Id && r.Status == RentalStatus.Active);

        if (hasActiveRental)
            throw new DomainException("Vehicle is already rented.");

        reservation.StartRental();
        var rental = Rental.CreateFromReservation(reservation);
        rental.Start(request.OdometerStart);

        _reservations.Update(reservation);
        _rentals.Add(rental);
        await _unitOfWork.SaveChangesAsync(ct);

        return new RentalResponse(
            rental.Id, rental.ReservationId, rental.VehicleId, rental.CustomerId,
            rental.ActualStart, rental.ActualEnd,
            rental.OdometerStart, rental.OdometerEnd,
            rental.Status.ToString());
    }
}
