using MediatR;
using Rentalin.Core.Interfaces;
using Rentalin.Fleet.Contracts;
using Rentalin.Fleet.Domain.Entities;

namespace Rentalin.Fleet.Handlers;

public sealed class CreateStaffHandler : IRequestHandler<CreateStaffRequest, StaffResponse>
{
    private readonly IRepository<Staff> _staff;
    private readonly IUnitOfWork _unitOfWork;

    public CreateStaffHandler(IRepository<Staff> staff, IUnitOfWork unitOfWork)
    {
        _staff = staff;
        _unitOfWork = unitOfWork;
    }

    public async Task<StaffResponse> Handle(CreateStaffRequest request, CancellationToken ct)
    {
        var staff = Staff.Create(request.Name, request.Email, request.PhoneNumber, request.Role, request.BusinessId);
        _staff.Add(staff);
        await _unitOfWork.SaveChangesAsync(ct);

        return new StaffResponse(staff.Id, staff.Name, staff.Email, staff.PhoneNumber, staff.Role, staff.BusinessId, staff.IsActive);
    }
}
