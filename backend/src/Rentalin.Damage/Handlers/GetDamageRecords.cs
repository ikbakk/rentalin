using MediatR;
using Rentalin.Core.Interfaces;
using Rentalin.Damage.Contracts;
using Rentalin.Damage.Domain.Entities;

namespace Rentalin.Damage.Handlers;

public sealed class GetDamageRecordsHandler : IRequestHandler<GetDamageRecordsRequest, IReadOnlyList<DamageRecordResponse>>
{
    private readonly IRepository<DamageRecord> _damageRecords;

    public GetDamageRecordsHandler(IRepository<DamageRecord> damageRecords)
    {
        _damageRecords = damageRecords;
    }

    public async Task<IReadOnlyList<DamageRecordResponse>> Handle(GetDamageRecordsRequest request, CancellationToken ct)
    {
        var records = await _damageRecords.GetAllAsync(ct);

        if (request.RentalId.HasValue)
            records = records.Where(r => r.RentalId == request.RentalId.Value).ToList();

        if (request.VehicleId.HasValue)
            records = records.Where(r => r.VehicleId == request.VehicleId.Value).ToList();

        return records.Select(r => new DamageRecordResponse(
            r.Id, r.RentalId, r.VehicleId, r.InspectionId,
            r.Description, r.Severity.ToString(), r.Status.ToString(),
            r.PhotoUrls, r.ResponsibleParty.ToString(),
            r.ResolutionNotes, r.ResolvedAt, r.WaivedAt)).ToList();
    }
}

public sealed record GetDamageRecordsRequest(Guid? RentalId = null, Guid? VehicleId = null) : IRequest<IReadOnlyList<DamageRecordResponse>>;
