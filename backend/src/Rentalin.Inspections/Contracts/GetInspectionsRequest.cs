using MediatR;

namespace Rentalin.Inspections.Contracts;

public sealed record GetInspectionsRequest : IRequest<IReadOnlyList<InspectionResponse>>;
