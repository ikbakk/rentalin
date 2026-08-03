using MediatR;
using Rentalin.Core.Interfaces;
using Rentalin.Damage.Contracts;
using Rentalin.Damage.Domain.Entities;
using Rentalin.Damage.Domain.Enums;

namespace Rentalin.Damage.Handlers;

public sealed class CreateDamageRecordHandler : IRequestHandler<CreateDamageRecordRequest, DamageRecordResponse>
{
    private readonly IRepository<DamageRecord> _damageRecords;
    private readonly IUnitOfWork _unitOfWork;

    public CreateDamageRecordHandler(IRepository<DamageRecord> damageRecords, IUnitOfWork unitOfWork)
    {
        _damageRecords = damageRecords;
        _unitOfWork = unitOfWork;
    }

    public async Task<DamageRecordResponse> Handle(CreateDamageRecordRequest request, CancellationToken ct)
    {
        var record = DamageRecord.Create(
            request.RentalId,
            request.VehicleId,
            request.InspectionId,
            request.Description,
            Enum.Parse<DamageSeverity>(request.Severity),
            request.PhotoUrls,
            Enum.Parse<ResponsibleParty>(request.ResponsibleParty));

        _damageRecords.Add(record);
        await _unitOfWork.SaveChangesAsync(ct);

        return new DamageRecordResponse(
            record.Id, record.RentalId, record.VehicleId, record.InspectionId,
            record.Description, record.Severity.ToString(), record.Status.ToString(),
            record.PhotoUrls, record.ResponsibleParty.ToString(),
            record.ResolutionNotes, record.ResolvedAt, record.WaivedAt);
    }
}

public sealed record CreateDamageRecordRequest(
    Guid RentalId,
    Guid VehicleId,
    Guid? InspectionId,
    string Description,
    string Severity,
    List<string> PhotoUrls,
    string ResponsibleParty) : IRequest<DamageRecordResponse>;
