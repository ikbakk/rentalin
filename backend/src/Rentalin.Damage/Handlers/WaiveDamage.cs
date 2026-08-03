using MediatR;
using Rentalin.Core.Interfaces;
using Rentalin.Damage.Contracts;
using Rentalin.Damage.Domain.Entities;

namespace Rentalin.Damage.Handlers;

public sealed class WaiveDamageHandler : IRequestHandler<WaiveDamageRequest, DamageRecordResponse>
{
    private readonly IRepository<DamageRecord> _damageRecords;
    private readonly IUnitOfWork _unitOfWork;

    public WaiveDamageHandler(IRepository<DamageRecord> damageRecords, IUnitOfWork unitOfWork)
    {
        _damageRecords = damageRecords;
        _unitOfWork = unitOfWork;
    }

    public async Task<DamageRecordResponse> Handle(WaiveDamageRequest request, CancellationToken ct)
    {
        var record = await _damageRecords.GetByIdAsync(request.DamageId, ct)
            ?? throw new InvalidOperationException($"Damage record {request.DamageId} not found.");

        record.Waive(request.Reason);
        _damageRecords.Update(record);
        await _unitOfWork.SaveChangesAsync(ct);

        return new DamageRecordResponse(
            record.Id, record.RentalId, record.VehicleId, record.InspectionId,
            record.Description, record.Severity.ToString(), record.Status.ToString(),
            record.PhotoUrls, record.ResponsibleParty.ToString(),
            record.ResolutionNotes, record.ResolvedAt, record.WaivedAt);
    }
}

public sealed record WaiveDamageRequest(Guid DamageId, string Reason) : IRequest<DamageRecordResponse>;
