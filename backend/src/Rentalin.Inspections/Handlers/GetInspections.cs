using MediatR;
using Rentalin.Core.Interfaces;
using Rentalin.Inspections.Contracts;
using Rentalin.Inspections.Domain.Entities;

namespace Rentalin.Inspections.Handlers;

public sealed class GetInspectionsHandler : IRequestHandler<GetInspectionsRequest, IReadOnlyList<InspectionResponse>>
{
    private readonly IRepository<Inspection> _inspections;

    public GetInspectionsHandler(IRepository<Inspection> inspections)
    {
        _inspections = inspections;
    }

    public async Task<IReadOnlyList<InspectionResponse>> Handle(GetInspectionsRequest request, CancellationToken ct)
    {
        var inspections = await _inspections.GetAllAsync(ct);
        return inspections.Select(i => new InspectionResponse(
            i.Id, i.VehicleId, i.RentalId,
            i.Type.ToString(), i.Status.ToString(),
            i.PhotoUrls, i.Notes)).ToList();
    }
}
