using MediatR;

namespace Rentalin.Inspections.Contracts;

public sealed record CompleteInspectionRequest(Guid InspectionId, List<string>? PhotoUrls = null) : IRequest<InspectionResponse>;
