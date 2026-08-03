using MediatR;

namespace Rentalin.Inspections.Contracts;

public sealed record GetInspectionByIdRequest(Guid Id) : IRequest<InspectionResponse>;
