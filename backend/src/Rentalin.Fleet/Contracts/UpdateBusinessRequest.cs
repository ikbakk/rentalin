using MediatR;

namespace Rentalin.Fleet.Contracts;

public sealed record UpdateBusinessRequest(
    string Name,
    string Address,
    string PhoneNumber,
    string Email) : IRequest<BusinessResponse>
{
    public Guid Id { get; set; }
}
