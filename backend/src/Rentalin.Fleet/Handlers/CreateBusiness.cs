using MediatR;
using Rentalin.Core.Interfaces;
using Rentalin.Fleet.Contracts;
using Rentalin.Fleet.Domain.Entities;

namespace Rentalin.Fleet.Handlers;

public sealed class CreateBusinessHandler : IRequestHandler<CreateBusinessRequest, BusinessResponse>
{
    private readonly IRepository<Business> _businesses;
    private readonly IUnitOfWork _unitOfWork;

    public CreateBusinessHandler(IRepository<Business> businesses, IUnitOfWork unitOfWork)
    {
        _businesses = businesses;
        _unitOfWork = unitOfWork;
    }

    public async Task<BusinessResponse> Handle(CreateBusinessRequest request, CancellationToken ct)
    {
        var business = Business.Create(request.Name, request.Address, request.PhoneNumber, request.Email);
        _businesses.Add(business);
        await _unitOfWork.SaveChangesAsync(ct);

        return new BusinessResponse(business.Id, business.Name, business.Address, business.PhoneNumber, business.Email, business.LogoUrl, business.Slug);
    }
}
