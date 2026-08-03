using MediatR;
using Rentalin.Core.Interfaces;
using Rentalin.Inspections.Contracts;
using Rentalin.Inspections.Domain.Entities;
using Rentalin.Inspections.Domain.Enums;

namespace Rentalin.Inspections.Handlers;

public sealed class CreateInspectionHandler : IRequestHandler<CreateInspectionRequest, InspectionResponse>
{
    private readonly IRepository<Inspection> _inspections;
    private readonly IUnitOfWork _unitOfWork;

    public CreateInspectionHandler(IRepository<Inspection> inspections, IUnitOfWork unitOfWork)
    {
        _inspections = inspections;
        _unitOfWork = unitOfWork;
    }

    public async Task<InspectionResponse> Handle(CreateInspectionRequest request, CancellationToken ct)
    {
        var type = Enum.Parse<InspectionType>(request.InspectionType);
        var inspection = Inspection.Create(request.VehicleId, request.RentalId, type, request.PhotoUrls, request.Notes);

        _inspections.Add(inspection);
        await _unitOfWork.SaveChangesAsync(ct);

        return new InspectionResponse(
            inspection.Id, inspection.VehicleId, inspection.RentalId,
            inspection.Type.ToString(), inspection.Status.ToString(),
            inspection.PhotoUrls, inspection.Notes);
    }
}
