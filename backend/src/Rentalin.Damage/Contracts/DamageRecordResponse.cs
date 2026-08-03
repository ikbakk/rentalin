namespace Rentalin.Damage.Contracts;

public sealed record DamageRecordResponse(
    Guid Id,
    Guid RentalId,
    Guid VehicleId,
    Guid? InspectionId,
    string Description,
    string Severity,
    string Status,
    List<string> PhotoUrls,
    string ResponsibleParty,
    string? ResolutionNotes,
    DateTimeOffset? ResolvedAt,
    DateTimeOffset? WaivedAt);
