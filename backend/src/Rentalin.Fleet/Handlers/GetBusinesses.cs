using MediatR;
using Rentalin.Core.Interfaces;
using Rentalin.Fleet.Contracts;
using Rentalin.Fleet.Domain.Entities;

namespace Rentalin.Fleet.Handlers;

public sealed class GetBusinessesHandler : IRequestHandler<GetBusinessesRequest, IReadOnlyList<BusinessResponse>>
{
    private readonly IRepository<Business> _businesses;

    public GetBusinessesHandler(IRepository<Business> businesses)
    {
        _businesses = businesses;
    }

    public async Task<IReadOnlyList<BusinessResponse>> Handle(GetBusinessesRequest request, CancellationToken ct)
    {
        var businesses = await _businesses.GetAllAsync(ct);
        return businesses.Select(b => new BusinessResponse(b.Id, b.Name, b.Address, b.PhoneNumber, b.Email, b.LogoUrl)).ToList();
    }
}

public sealed record GetBusinessesRequest : IRequest<IReadOnlyList<BusinessResponse>>;
