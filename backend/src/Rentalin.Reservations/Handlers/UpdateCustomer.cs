using MediatR;
using Rentalin.Core.Interfaces;
using Rentalin.Reservations.Contracts;
using Rentalin.Reservations.Domain.Entities;

namespace Rentalin.Reservations.Handlers;

public sealed class UpdateCustomerHandler : IRequestHandler<UpdateCustomerRequest, CustomerResponse>
{
    private readonly IRepository<Customer> _customers;
    private readonly IUnitOfWork _unitOfWork;

    public UpdateCustomerHandler(IRepository<Customer> customers, IUnitOfWork unitOfWork)
    {
        _customers = customers;
        _unitOfWork = unitOfWork;
    }

    public async Task<CustomerResponse> Handle(UpdateCustomerRequest request, CancellationToken ct)
    {
        var customer = await _customers.GetByIdAsync(request.Id, ct)
            ?? throw new InvalidOperationException($"Customer {request.Id} not found.");

        customer.Update(request.Name, request.Email, request.PhoneNumber, request.Notes);

        _customers.Update(customer);
        await _unitOfWork.SaveChangesAsync(ct);

        return new CustomerResponse(customer.Id, customer.Name, customer.Phone, customer.Email, customer.Notes);
    }
}
