using MediatR;
using Rentalin.Core.Interfaces;
using Rentalin.Fleet.Contracts;
using Rentalin.Fleet.Domain.Entities;

namespace Rentalin.Fleet.Handlers;

public sealed class GetStaffHandler : IRequestHandler<GetStaffRequest, IReadOnlyList<StaffResponse>>
{
    private readonly IRepository<Staff> _staff;

    public GetStaffHandler(IRepository<Staff> staff)
    {
        _staff = staff;
    }

    public async Task<IReadOnlyList<StaffResponse>> Handle(GetStaffRequest request, CancellationToken ct)
    {
        var staff = await _staff.GetAllAsync(ct);
        return staff.Select(s => new StaffResponse(s.Id, s.Name, s.Email, s.PhoneNumber, s.Role, s.BusinessId, s.IsActive)).ToList();
    }
}

public sealed record GetStaffRequest : IRequest<IReadOnlyList<StaffResponse>>;
