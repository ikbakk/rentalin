using MediatR;
using Rentalin.Core.Exceptions;
using Rentalin.Core.Interfaces;
using Rentalin.Core.ValueObjects;
using Rentalin.Fleet.Domain.Entities;
using Rentalin.Reservations.Contracts;
using Rentalin.Reservations.Domain.Entities;
using Rentalin.Reservations.Domain.Services;

namespace Rentalin.Reservations.Handlers;

public sealed class CreateInquiryHandler : IRequestHandler<CreateInquiryRequest, InquiryResponse>
{
    private readonly IRepository<Inquiry> _inquiries;
    private readonly IRepository<Customer> _customers;
    private readonly IRepository<Vehicle> _vehicles;
    private readonly IRepository<Reservation> _reservations;
    private readonly IUnitOfWork _unitOfWork;

    public CreateInquiryHandler(
        IRepository<Inquiry> inquiries, IRepository<Customer> customers,
        IRepository<Vehicle> vehicles, IRepository<Reservation> reservations,
        IUnitOfWork unitOfWork)
    {
        _inquiries = inquiries;
        _customers = customers;
        _vehicles = vehicles;
        _reservations = reservations;
        _unitOfWork = unitOfWork;
    }

    public async Task<InquiryResponse> Handle(CreateInquiryRequest request, CancellationToken ct)
    {
        var customerId = request.CustomerId;
        string customerName = request.CustomerName ?? "Customer";

        if (customerId is null && request.CustomerName is not null)
        {
            var customer = Customer.Create(request.CustomerName, "", request.CustomerPhone ?? "-", null);
            _customers.Add(customer);
            await _unitOfWork.SaveChangesAsync(ct);
            customerId = customer.Id;
        }

        if (customerId is null)
            throw new InvalidOperationException("CustomerId or CustomerName is required");

        var rentalPeriod = new DateRange(request.StartDate, request.EndDate);

        var vehicle = await _vehicles.GetByIdAsync(request.VehicleId, ct)
            ?? throw new DomainException("Vehicle not found.");

        var existingReservations = await _reservations.GetAllAsync(ct);

        var availability = new VehicleAvailabilityService();
        if (!availability.IsAvailable(vehicle, rentalPeriod, existingReservations))
            throw new DomainException("Vehicle is not available for the requested dates.");

        var inquiry = Inquiry.Create(customerId.Value, request.VehicleId, rentalPeriod, request.Notes);

        _inquiries.Add(inquiry);
        await _unitOfWork.SaveChangesAsync(ct);

        return new InquiryResponse(
            inquiry.Id, inquiry.CustomerId, customerName,
            inquiry.VehicleId, $"{vehicle.LicensePlate} {vehicle.Make} {vehicle.Model}",
            inquiry.RentalPeriod.Start, inquiry.RentalPeriod.End,
            inquiry.Status.ToString(), inquiry.Notes);
    }
}
