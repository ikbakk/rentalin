using MediatR;
using Rentalin.Core.Interfaces;
using Rentalin.Fleet.Contracts;
using Rentalin.Fleet.Domain.Entities;

namespace Rentalin.Fleet.Handlers;

public sealed class UpdateBusinessHandler : IRequestHandler<UpdateBusinessRequest, BusinessResponse>
{
    private readonly IRepository<Business> _businesses;
    private readonly IUnitOfWork _unitOfWork;

    public UpdateBusinessHandler(IRepository<Business> businesses, IUnitOfWork unitOfWork)
    {
        _businesses = businesses;
        _unitOfWork = unitOfWork;
    }

    public async Task<BusinessResponse> Handle(UpdateBusinessRequest request, CancellationToken ct)
    {
        var business = await _businesses.GetByIdAsync(request.Id, ct)
            ?? throw new InvalidOperationException($"Business {request.Id} not found.");

        business.UpdateDetails(request.Name, request.Address, request.PhoneNumber, request.Email);
        _businesses.Update(business);
        await _unitOfWork.SaveChangesAsync(ct);

        return new BusinessResponse(business.Id, business.Name, business.Address, business.PhoneNumber, business.Email, business.LogoUrl, business.Slug);
    }
}
