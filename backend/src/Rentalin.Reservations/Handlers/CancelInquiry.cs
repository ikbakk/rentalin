using MediatR;
using Rentalin.Core.Exceptions;
using Rentalin.Core.Interfaces;
using Rentalin.Fleet.Domain.Entities;
using Rentalin.Reservations.Contracts;
using Rentalin.Reservations.Domain.Entities;

namespace Rentalin.Reservations.Handlers;

public sealed class CancelInquiryHandler : IRequestHandler<CancelInquiryRequest, InquiryResponse>
{
    private readonly IRepository<Inquiry> _inquiries;
    private readonly IRepository<Customer> _customers;
    private readonly IRepository<Vehicle> _vehicles;
    private readonly IUnitOfWork _unitOfWork;

    public CancelInquiryHandler(
        IRepository<Inquiry> inquiries, IRepository<Customer> customers,
        IRepository<Vehicle> vehicles, IUnitOfWork unitOfWork)
    {
        _inquiries = inquiries; _customers = customers;
        _vehicles = vehicles; _unitOfWork = unitOfWork;
    }

    public async Task<InquiryResponse> Handle(CancelInquiryRequest request, CancellationToken ct)
    {
        var inquiry = await _inquiries.GetByIdAsync(request.InquiryId, ct)
            ?? throw new DomainException($"Inquiry {request.InquiryId} not found.");

        inquiry.Cancel(request.Reason);
        _inquiries.Update(inquiry);
        await _unitOfWork.SaveChangesAsync(ct);

        var customer = await _customers.GetByIdAsync(inquiry.CustomerId, ct);
        var vehicle = await _vehicles.GetByIdAsync(inquiry.VehicleId, ct);

        return new InquiryResponse(
            inquiry.Id, inquiry.CustomerId, customer?.Name ?? "Customer",
            inquiry.VehicleId, vehicle is not null ? $"{vehicle.LicensePlate} {vehicle.Make} {vehicle.Model}" : "Vehicle",
            inquiry.RentalPeriod.Start, inquiry.RentalPeriod.End,
            inquiry.Status.ToString(), inquiry.Notes);
    }
}
