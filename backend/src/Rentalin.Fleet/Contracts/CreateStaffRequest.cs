using MediatR;

namespace Rentalin.Fleet.Contracts;

public sealed record CreateStaffRequest(
    string Name,
    string Email,
    string PhoneNumber,
    string Role,
    Guid BusinessId) : IRequest<StaffResponse>;
