using MediatR;
using Rentalin.Core.Interfaces;
using Rentalin.Inspections.Contracts;
using Rentalin.Inspections.Domain.Entities;
using Rentalin.Inspections.Domain.Enums;

namespace Rentalin.Inspections.Handlers;

public sealed class FailInspectionHandler : IRequestHandler<FailInspectionRequest, InspectionResponse>
{
    private readonly IRepository<Inspection> _inspections;
    private readonly IUnitOfWork _unitOfWork;

    public FailInspectionHandler(IRepository<Inspection> inspections, IUnitOfWork unitOfWork)
    {
        _inspections = inspections;
        _unitOfWork = unitOfWork;
    }

    public async Task<InspectionResponse> Handle(FailInspectionRequest request, CancellationToken ct)
    {
        var inspection = await _inspections.GetByIdAsync(request.InspectionId, ct)
            ?? throw new InvalidOperationException($"Inspection {request.InspectionId} not found.");

        inspection.Fail(request.Reason);
        _inspections.Update(inspection);
        await _unitOfWork.SaveChangesAsync(ct);

        return new InspectionResponse(
            inspection.Id, inspection.VehicleId, inspection.RentalId,
            inspection.Type.ToString(), inspection.Status.ToString(),
            inspection.PhotoUrls, inspection.Notes);
    }
}
