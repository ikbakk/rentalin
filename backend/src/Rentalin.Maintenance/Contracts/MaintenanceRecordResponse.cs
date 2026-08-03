namespace Rentalin.Maintenance.Contracts;

public sealed record MaintenanceRecordResponse(
    Guid Id,
    Guid VehicleId,
    string Type,
    string Description,
    string Status,
    DateTimeOffset ScheduledStart,
    DateTimeOffset? ActualStart,
    DateTimeOffset? ActualEnd,
    decimal CostAmount,
    string CostCurrency,
    string? Workshop,
    string? Notes,
    List<string> PhotoUrls);
