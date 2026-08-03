using Rentalin.Core.Entities;
using Rentalin.Core.ValueObjects;
using Rentalin.Maintenance.Domain.Documents;
using Rentalin.Maintenance.Domain.Enums;

namespace Rentalin.Maintenance.Domain.Entities;

public sealed class MaintenanceRecord : AggregateRoot
{
    public Guid VehicleId { get; private set; }
    public MaintenanceType Type { get; private set; }
    public string Description { get; private set; }
    public MaintenanceStatus Status { get; private set; }
    public DateTimeOffset ScheduledStart { get; private set; }
    public DateTimeOffset? ActualStart { get; private set; }
    public DateTimeOffset? ActualEnd { get; private set; }
    public Money Cost { get; private set; }
    public string? Workshop { get; private set; }
    public string? Notes { get; private set; }
    public List<string> PhotoUrls { get; private set; }

    private MaintenanceRecord()
    {
        Description = string.Empty;
        PhotoUrls = [];
        Cost = Money.Zero("IDR");
    }

    public static MaintenanceRecord Create(
        Guid vehicleId,
        MaintenanceType type,
        string description,
        DateTimeOffset scheduledStart,
        Money cost,
        string? workshop,
        string? notes)
    {
        var record = new MaintenanceRecord
        {
            Id = Guid.NewGuid(),
            VehicleId = vehicleId,
            Type = type,
            Description = description,
            Status = MaintenanceStatus.Scheduled,
            ScheduledStart = scheduledStart,
            Cost = cost,
            Workshop = workshop,
            Notes = notes
        };

        record.AddDomainEvent(new MaintenanceScheduled(record.Id, vehicleId, type.ToString(), scheduledStart, DateTimeOffset.UtcNow));
        return record;
    }

    public void Start()
    {
        if (Status != MaintenanceStatus.Scheduled)
            throw new InvalidOperationException("Can only start a scheduled maintenance.");

        Status = MaintenanceStatus.InProgress;
        ActualStart = DateTimeOffset.UtcNow;
    }

    public void Complete(string? notes, Money? actualCost)
    {
        if (Status != MaintenanceStatus.InProgress)
            throw new InvalidOperationException("Can only complete a maintenance that is in progress.");

        Status = MaintenanceStatus.Completed;
        ActualEnd = DateTimeOffset.UtcNow;
        if (notes is not null) Notes = notes;
        if (actualCost is not null) Cost = actualCost;

        AddDomainEvent(new MaintenanceCompleted(Id, VehicleId, DateTimeOffset.UtcNow));
    }

    public void Cancel(string reason)
    {
        if (Status == MaintenanceStatus.Completed || Status == MaintenanceStatus.Cancelled)
            throw new InvalidOperationException("Cannot cancel a completed or already cancelled maintenance.");

        Status = MaintenanceStatus.Cancelled;
        Notes = string.IsNullOrWhiteSpace(Notes) ? $"Cancelled: {reason}" : $"{Notes}\n\nCancelled: {reason}";

        AddDomainEvent(new MaintenanceCancelled(Id, VehicleId, reason, DateTimeOffset.UtcNow));
    }
}
