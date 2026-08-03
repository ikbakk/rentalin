using MediatR;

namespace Rentalin.Reservations.Contracts;

public sealed record RejectRentalRequest(Guid RentalId, string Reason) : IRequest<RentalResponse>;
