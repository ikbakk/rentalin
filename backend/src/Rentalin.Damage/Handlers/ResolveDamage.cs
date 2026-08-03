using MediatR;
using Rentalin.Core.Interfaces;
using Rentalin.Damage.Contracts;
using Rentalin.Damage.Domain.Entities;

namespace Rentalin.Damage.Handlers;

public sealed class ResolveDamageHandler : IRequestHandler<ResolveDamageRequest, DamageRecordResponse>
{
    private readonly IRepository<DamageRecord> _damageRecords;
    private readonly IUnitOfWork _unitOfWork;

    public ResolveDamageHandler(IRepository<DamageRecord> damageRecords, IUnitOfWork unitOfWork)
    {
        _damageRecords = damageRecords;
        _unitOfWork = unitOfWork;
    }

    public async Task<DamageRecordResponse> Handle(ResolveDamageRequest request, CancellationToken ct)
    {
        var record = await _damageRecords.GetByIdAsync(request.DamageId, ct)
            ?? throw new InvalidOperationException($"Damage record {request.DamageId} not found.");

        record.Resolve(request.ResolutionNotes);
        _damageRecords.Update(record);
        await _unitOfWork.SaveChangesAsync(ct);

        return new DamageRecordResponse(
            record.Id, record.RentalId, record.VehicleId, record.InspectionId,
            record.Description, record.Severity.ToString(), record.Status.ToString(),
            record.PhotoUrls, record.ResponsibleParty.ToString(),
            record.ResolutionNotes, record.ResolvedAt, record.WaivedAt);
    }
}

public sealed record ResolveDamageRequest(Guid DamageId, string ResolutionNotes) : IRequest<DamageRecordResponse>;
