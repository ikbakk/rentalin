using Rentalin.Core.Entities;
using Rentalin.Core.Exceptions;
using Rentalin.Inspections.Domain.Documents;
using Rentalin.Inspections.Domain.Enums;

namespace Rentalin.Inspections.Domain.Entities;

public sealed class Inspection : AggregateRoot
{
    public Guid VehicleId { get; private set; }
    public Guid RentalId { get; private set; }
    public InspectionType Type { get; private set; }
    public InspectionStatus Status { get; private set; }
    public List<string> PhotoUrls { get; private set; }
    public string Notes { get; private set; }

    private Inspection()
    {
        PhotoUrls = [];
        Notes = string.Empty;
    }

    public static Inspection Create(Guid vehicleId, Guid rentalId, InspectionType type, List<string> photoUrls, string notes)
    {
        var inspection = new Inspection
        {
            Id = Guid.NewGuid(),
            VehicleId = vehicleId,
            RentalId = rentalId,
            Type = type,
            Status = InspectionStatus.Pending,
            PhotoUrls = photoUrls,
            Notes = notes
        };

        inspection.AddDomainEvent(new InspectionCreated(inspection.Id, vehicleId, DateTimeOffset.UtcNow));
        return inspection;
    }

    public void Complete(bool requiresNotes)
    {
        if (Status != InspectionStatus.Pending && Status != InspectionStatus.InProgress)
            throw new DomainException("Cannot complete inspection — inspection already completed.");

        if (requiresNotes && string.IsNullOrWhiteSpace(Notes))
            throw new DomainException("Notes are required when inspection has issues.");

        Status = InspectionStatus.Completed;
        AddDomainEvent(new InspectionCompleted(Id, VehicleId, DateTimeOffset.UtcNow));
    }

    public void Fail(string reason)
    {
        if (Status != InspectionStatus.Pending && Status != InspectionStatus.InProgress)
            throw new DomainException("Cannot fail inspection — inspection is not in progress or pending.");

        if (string.IsNullOrWhiteSpace(reason))
            throw new DomainException("Reason is required when failing an inspection.");

        Notes = string.IsNullOrWhiteSpace(Notes)
            ? $"FAILED: {reason}"
            : $"{Notes}\n\nFAILED: {reason}";
        Status = InspectionStatus.Failed;
        AddDomainEvent(new InspectionFailed(Id, VehicleId, reason, DateTimeOffset.UtcNow));
    }
}
