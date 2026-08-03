using MediatR;
using Rentalin.Core.Interfaces;
using Rentalin.Inspections.Contracts;
using Rentalin.Inspections.Domain.Entities;

namespace Rentalin.Inspections.Handlers;

public sealed class GetInspectionByIdHandler : IRequestHandler<GetInspectionByIdRequest, InspectionResponse>
{
    private readonly IRepository<Inspection> _inspections;

    public GetInspectionByIdHandler(IRepository<Inspection> inspections)
    {
        _inspections = inspections;
    }

    public async Task<InspectionResponse> Handle(GetInspectionByIdRequest request, CancellationToken ct)
    {
        var inspection = await _inspections.GetByIdAsync(request.Id, ct)
            ?? throw new InvalidOperationException($"Inspection {request.Id} not found.");

        return new InspectionResponse(
            inspection.Id, inspection.VehicleId, inspection.RentalId,
            inspection.Type.ToString(), inspection.Status.ToString(),
            inspection.PhotoUrls, inspection.Notes);
    }
}
