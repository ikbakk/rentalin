using MediatR;

namespace Rentalin.Fleet.Contracts;

public sealed record DeactivateStaffRequest(Guid Id) : IRequest<StaffResponse>;
