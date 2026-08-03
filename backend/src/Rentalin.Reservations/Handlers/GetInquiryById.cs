using MediatR;
using Rentalin.Core.Interfaces;
using Rentalin.Fleet.Domain.Entities;
using Rentalin.Reservations.Contracts;
using Rentalin.Reservations.Domain.Entities;

namespace Rentalin.Reservations.Handlers;

public sealed class GetInquiryByIdHandler : IRequestHandler<GetInquiryByIdRequest, InquiryResponse>
{
    private readonly IRepository<Inquiry> _inquiries;
    private readonly IRepository<Customer> _customers;
    private readonly IRepository<Vehicle> _vehicles;

    public GetInquiryByIdHandler(
        IRepository<Inquiry> inquiries, IRepository<Customer> customers, IRepository<Vehicle> vehicles)
    {
        _inquiries = inquiries;
        _customers = customers;
        _vehicles = vehicles;
    }

    public async Task<InquiryResponse> Handle(GetInquiryByIdRequest request, CancellationToken ct)
    {
        var inquiry = await _inquiries.GetByIdAsync(request.Id, ct)
            ?? throw new InvalidOperationException($"Inquiry {request.Id} not found.");

        var customer = await _customers.GetByIdAsync(inquiry.CustomerId, ct);
        var vehicle = await _vehicles.GetByIdAsync(inquiry.VehicleId, ct);

        return new InquiryResponse(
            inquiry.Id, inquiry.CustomerId, customer?.Name ?? "Customer",
            inquiry.VehicleId, vehicle is not null ? $"{vehicle.LicensePlate} {vehicle.Make} {vehicle.Model}" : "Vehicle",
            inquiry.RentalPeriod.Start, inquiry.RentalPeriod.End,
            inquiry.Status.ToString(), inquiry.Notes);
    }
}
