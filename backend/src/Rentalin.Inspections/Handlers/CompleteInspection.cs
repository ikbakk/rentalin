using MediatR;
using Rentalin.Core.Interfaces;
using Rentalin.Inspections.Contracts;
using Rentalin.Inspections.Domain.Entities;

namespace Rentalin.Inspections.Handlers;

public sealed class CompleteInspectionHandler : IRequestHandler<CompleteInspectionRequest, InspectionResponse>
{
    private readonly IRepository<Inspection> _inspections;
    private readonly IUnitOfWork _unitOfWork;

    public CompleteInspectionHandler(IRepository<Inspection> inspections, IUnitOfWork unitOfWork)
    {
        _inspections = inspections;
        _unitOfWork = unitOfWork;
    }

    public async Task<InspectionResponse> Handle(CompleteInspectionRequest request, CancellationToken ct)
    {
        var inspection = await _inspections.GetByIdAsync(request.InspectionId, ct)
            ?? throw new InvalidOperationException($"Inspection {request.InspectionId} not found.");

        if (request.PhotoUrls is { Count: > 0 })
            inspection.PhotoUrls.AddRange(request.PhotoUrls);

        inspection.Complete(false);

        _inspections.Update(inspection);
        await _unitOfWork.SaveChangesAsync(ct);

        return new InspectionResponse(
            inspection.Id, inspection.VehicleId, inspection.RentalId,
            inspection.Type.ToString(), inspection.Status.ToString(),
            inspection.PhotoUrls, inspection.Notes);
    }
}
