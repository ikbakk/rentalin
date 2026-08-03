using MediatR;
using Rentalin.Core.Interfaces;
using Rentalin.Fleet.Contracts;
using Rentalin.Fleet.Domain.Entities;

namespace Rentalin.Fleet.Handlers;

public sealed class DeactivateStaffHandler : IRequestHandler<DeactivateStaffRequest, StaffResponse>
{
    private readonly IRepository<Staff> _staff;
    private readonly IUnitOfWork _unitOfWork;

    public DeactivateStaffHandler(IRepository<Staff> staff, IUnitOfWork unitOfWork)
    {
        _staff = staff;
        _unitOfWork = unitOfWork;
    }

    public async Task<StaffResponse> Handle(DeactivateStaffRequest request, CancellationToken ct)
    {
        var staff = await _staff.GetByIdAsync(request.Id, ct)
            ?? throw new InvalidOperationException($"Staff {request.Id} not found.");

        staff.Deactivate();
        _staff.Update(staff);
        await _unitOfWork.SaveChangesAsync(ct);

        return new StaffResponse(staff.Id, staff.Name, staff.Email, staff.PhoneNumber, staff.Role, staff.BusinessId, staff.IsActive);
    }
}
