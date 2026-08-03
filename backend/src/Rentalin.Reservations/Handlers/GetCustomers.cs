using MediatR;
using Rentalin.Core.Interfaces;
using Rentalin.Reservations.Contracts;
using Rentalin.Reservations.Domain.Entities;

namespace Rentalin.Reservations.Handlers;

public sealed class GetCustomersHandler : IRequestHandler<GetCustomersRequest, IReadOnlyList<CustomerResponse>>
{
    private readonly IRepository<Customer> _customers;

    public GetCustomersHandler(IRepository<Customer> customers)
    {
        _customers = customers;
    }

    public async Task<IReadOnlyList<CustomerResponse>> Handle(GetCustomersRequest request, CancellationToken ct)
    {
        var customers = await _customers.GetAllAsync(ct);
        return customers.Select(c => new CustomerResponse(
            c.Id, c.Name, c.Phone, c.Email, c.Notes)).ToList();
    }
}
