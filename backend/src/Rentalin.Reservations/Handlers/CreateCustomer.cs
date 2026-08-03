using MediatR;
using Rentalin.Core.Interfaces;
using Rentalin.Reservations.Contracts;
using Rentalin.Reservations.Domain.Entities;

namespace Rentalin.Reservations.Handlers;

public sealed class CreateCustomerHandler : IRequestHandler<CreateCustomerRequest, CustomerResponse>
{
    private readonly IRepository<Customer> _customers;
    private readonly IUnitOfWork _unitOfWork;

    public CreateCustomerHandler(IRepository<Customer> customers, IUnitOfWork unitOfWork)
    {
        _customers = customers;
        _unitOfWork = unitOfWork;
    }

    public async Task<CustomerResponse> Handle(CreateCustomerRequest request, CancellationToken ct)
    {
        var customer = Customer.Create(request.Name, request.Email, request.PhoneNumber, request.Notes);

        _customers.Add(customer);
        await _unitOfWork.SaveChangesAsync(ct);

        return MapToResponse(customer);
    }

    private static CustomerResponse MapToResponse(Customer customer)
    {
        return new CustomerResponse(customer.Id, customer.Name, customer.Phone, customer.Email, customer.Notes);
    }
}
