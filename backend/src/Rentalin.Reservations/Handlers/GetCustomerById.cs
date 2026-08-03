using MediatR;
using Rentalin.Core.Interfaces;
using Rentalin.Reservations.Contracts;
using Rentalin.Reservations.Domain.Entities;

namespace Rentalin.Reservations.Handlers;

public sealed class GetCustomerByIdHandler : IRequestHandler<GetCustomerByIdRequest, CustomerResponse>
{
    private readonly IRepository<Customer> _customers;

    public GetCustomerByIdHandler(IRepository<Customer> customers)
    {
        _customers = customers;
    }

    public async Task<CustomerResponse> Handle(GetCustomerByIdRequest request, CancellationToken ct)
    {
        var customer = await _customers.GetByIdAsync(request.Id, ct)
            ?? throw new InvalidOperationException($"Customer {request.Id} not found.");

        return new CustomerResponse(
            customer.Id, customer.Name, customer.Phone, customer.Email, customer.Notes);
    }
}
