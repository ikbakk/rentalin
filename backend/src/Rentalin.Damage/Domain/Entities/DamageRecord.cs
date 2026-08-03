using Rentalin.Core.Entities;
using Rentalin.Damage.Domain.Documents;
using Rentalin.Damage.Domain.Enums;

namespace Rentalin.Damage.Domain.Entities;

public sealed class DamageRecord : AggregateRoot
{
    public Guid RentalId { get; private set; }
    public Guid VehicleId { get; private set; }
    public Guid? InspectionId { get; private set; }
    public string Description { get; private set; }
    public DamageSeverity Severity { get; private set; }
    public DamageStatus Status { get; private set; }
    public List<string> PhotoUrls { get; private set; }
    public ResponsibleParty ResponsibleParty { get; private set; }
    public string? ResolutionNotes { get; private set; }
    public DateTimeOffset? ResolvedAt { get; private set; }
    public DateTimeOffset? WaivedAt { get; private set; }

    private DamageRecord()
    {
        Description = string.Empty;
        PhotoUrls = [];
    }

    public static DamageRecord Create(
        Guid rentalId,
        Guid vehicleId,
        Guid? inspectionId,
        string description,
        DamageSeverity severity,
        List<string> photoUrls,
        ResponsibleParty responsibleParty)
    {
        var record = new DamageRecord
        {
            Id = Guid.NewGuid(),
            RentalId = rentalId,
            VehicleId = vehicleId,
            InspectionId = inspectionId,
            Description = description,
            Severity = severity,
            Status = DamageStatus.Open,
            PhotoUrls = photoUrls,
            ResponsibleParty = responsibleParty
        };

        record.AddDomainEvent(new DamageCreated(record.Id, rentalId, vehicleId, description, severity.ToString(), DateTimeOffset.UtcNow));
        return record;
    }

    public void Resolve(string resolutionNotes)
    {
        if (Status == DamageStatus.Resolved || Status == DamageStatus.Waived)
            throw new InvalidOperationException("Cannot resolve a damage record that is already resolved or waived.");

        Status = DamageStatus.Resolved;
        ResolutionNotes = resolutionNotes;
        ResolvedAt = DateTimeOffset.UtcNow;
        AddDomainEvent(new DamageResolved(Id, RentalId, VehicleId, resolutionNotes, DateTimeOffset.UtcNow));
    }

    public void Waive(string reason)
    {
        if (Status == DamageStatus.Resolved || Status == DamageStatus.Waived)
            throw new InvalidOperationException("Cannot waive a damage record that is already resolved or waived.");

        Status = DamageStatus.Waived;
        ResolutionNotes = reason;
        WaivedAt = DateTimeOffset.UtcNow;
        AddDomainEvent(new DamageWaived(Id, RentalId, VehicleId, reason, DateTimeOffset.UtcNow));
    }
}
