using MediatR;

namespace Rentalin.Inspections.Contracts;

public sealed record FailInspectionRequest(Guid InspectionId, string Reason) : IRequest<InspectionResponse>;
