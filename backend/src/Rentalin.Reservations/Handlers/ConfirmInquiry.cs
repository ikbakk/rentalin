using MediatR;
using Rentalin.Core.Exceptions;
using Rentalin.Core.Interfaces;
using Rentalin.Fleet.Domain.Entities;
using Rentalin.Reservations.Contracts;
using Rentalin.Reservations.Domain.Entities;
using Rentalin.Reservations.Domain.Services;

namespace Rentalin.Reservations.Handlers;

public sealed class ConfirmInquiryHandler : IRequestHandler<ConfirmInquiryRequest, InquiryResponse>
{
    private readonly IRepository<Inquiry> _inquiries;
    private readonly IRepository<Vehicle> _vehicles;
    private readonly IRepository<Reservation> _reservations;
    private readonly IRepository<Customer> _customers;
    private readonly IUnitOfWork _unitOfWork;

    public ConfirmInquiryHandler(
        IRepository<Inquiry> inquiries, IRepository<Vehicle> vehicles,
        IRepository<Reservation> reservations, IRepository<Customer> customers,
        IUnitOfWork unitOfWork)
    {
        _inquiries = inquiries; _vehicles = vehicles;
        _reservations = reservations; _customers = customers;
        _unitOfWork = unitOfWork;
    }

    public async Task<InquiryResponse> Handle(ConfirmInquiryRequest request, CancellationToken ct)
    {
        var inquiry = await _inquiries.GetByIdAsync(request.InquiryId, ct)
            ?? throw new DomainException($"Inquiry {request.InquiryId} not found.");
        var vehicle = await _vehicles.GetByIdAsync(inquiry.VehicleId, ct)
            ?? throw new DomainException("Vehicle not found.");
        var existingReservations = await _reservations.GetAllAsync(ct);
        var availability = new VehicleAvailabilityService();
        if (!availability.IsAvailable(vehicle, inquiry.RentalPeriod, existingReservations))
            throw new DomainException("Vehicle already reserved for these dates.");

        inquiry.Confirm();
        _inquiries.Update(inquiry);
        await _unitOfWork.SaveChangesAsync(ct);

        var customer = await _customers.GetByIdAsync(inquiry.CustomerId, ct);
        return new InquiryResponse(
            inquiry.Id, inquiry.CustomerId, customer?.Name ?? "Customer",
            inquiry.VehicleId, $"{vehicle.LicensePlate} {vehicle.Make} {vehicle.Model}",
            inquiry.RentalPeriod.Start, inquiry.RentalPeriod.End,
            inquiry.Status.ToString(), inquiry.Notes);
    }
}
