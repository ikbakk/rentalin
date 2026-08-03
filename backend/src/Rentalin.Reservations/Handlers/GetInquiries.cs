using MediatR;
using Rentalin.Core.Interfaces;
using Rentalin.Fleet.Domain.Entities;
using Rentalin.Reservations.Contracts;
using Rentalin.Reservations.Domain.Entities;

namespace Rentalin.Reservations.Handlers;

public sealed class GetInquiriesHandler : IRequestHandler<GetInquiriesRequest, IReadOnlyList<InquiryResponse>>
{
    private readonly IRepository<Inquiry> _inquiries;
    private readonly IRepository<Customer> _customers;
    private readonly IRepository<Vehicle> _vehicles;

    public GetInquiriesHandler(
        IRepository<Inquiry> inquiries,
        IRepository<Customer> customers,
        IRepository<Vehicle> vehicles)
    {
        _inquiries = inquiries;
        _customers = customers;
        _vehicles = vehicles;
    }

    public async Task<IReadOnlyList<InquiryResponse>> Handle(GetInquiriesRequest request, CancellationToken ct)
    {
        var inquiries = await _inquiries.GetAllAsync(ct);
        var customers = await _customers.GetAllAsync(ct);
        var allVehicles = await _vehicles.GetAllAsync(ct);

        return inquiries.Select(i =>
        {
            var customer = customers.FirstOrDefault(c => c.Id == i.CustomerId);
            var vehicle = allVehicles.FirstOrDefault(v => v.Id == i.VehicleId);
            return new InquiryResponse(
                i.Id, i.CustomerId, customer?.Name ?? "Customer",
                i.VehicleId, vehicle is not null ? $"{vehicle.LicensePlate} {vehicle.Make} {vehicle.Model}" : "Vehicle",
                i.RentalPeriod.Start, i.RentalPeriod.End,
                i.Status.ToString(), i.Notes);
        }).ToList();
    }
}
