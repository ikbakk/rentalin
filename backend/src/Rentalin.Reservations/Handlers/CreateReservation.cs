using MediatR;
using Rentalin.Core.Exceptions;
using Rentalin.Core.Interfaces;
using Rentalin.Core.ValueObjects;
using Rentalin.Fleet.Domain.Entities;
using Rentalin.Reservations.Contracts;
using Rentalin.Reservations.Domain.Entities;
using Rentalin.Reservations.Domain.Services;

namespace Rentalin.Reservations.Handlers;

public sealed class CreateReservationHandler : IRequestHandler<CreateReservationRequest, ReservationResponse>
{
    private readonly IRepository<Inquiry> _inquiries;
    private readonly IRepository<Vehicle> _vehicles;
    private readonly IRepository<Reservation> _reservations;
    private readonly IUnitOfWork _unitOfWork;

    public CreateReservationHandler(
        IRepository<Inquiry> inquiries,
        IRepository<Vehicle> vehicles,
        IRepository<Reservation> reservations,
        IUnitOfWork unitOfWork)
    {
        _inquiries = inquiries;
        _vehicles = vehicles;
        _reservations = reservations;
        _unitOfWork = unitOfWork;
    }

    public async Task<ReservationResponse> Handle(CreateReservationRequest request, CancellationToken ct)
    {
        var inquiry = await _inquiries.GetByIdAsync(request.InquiryId, ct)
            ?? throw new DomainException($"Inquiry {request.InquiryId} not found.");

        var vehicle = await _vehicles.GetByIdAsync(inquiry.VehicleId, ct)
            ?? throw new DomainException("Vehicle not found.");

        var existingReservations = await _reservations.GetAllAsync(ct);

        var availability = new VehicleAvailabilityService();
        if (!availability.IsAvailable(vehicle, inquiry.RentalPeriod, existingReservations))
            throw new DomainException("Vehicle already reserved for these dates.");

        var estimatedCost = new Money(request.EstimatedCost, request.Currency);
        var reservation = Reservation.CreateFromInquiry(inquiry, estimatedCost);

        _reservations.Add(reservation);
        await _unitOfWork.SaveChangesAsync(ct);

        return new ReservationResponse(
            reservation.Id, reservation.InquiryId, reservation.CustomerId, reservation.VehicleId,
            reservation.RentalPeriod.Start, reservation.RentalPeriod.End,
            reservation.EstimatedCost.Amount, reservation.EstimatedCost.Currency,
            reservation.Status.ToString());
    }
}
