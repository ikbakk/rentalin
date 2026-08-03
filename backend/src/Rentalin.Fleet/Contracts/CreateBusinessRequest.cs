using MediatR;

namespace Rentalin.Fleet.Contracts;

public sealed record CreateBusinessRequest(
    string Name,
    string Address,
    string PhoneNumber,
    string Email) : IRequest<BusinessResponse>;
