using Rentalin.Core.Entities;

namespace Rentalin.Reservations.Domain.Entities;

public sealed class Customer : AggregateRoot
{
    public string Name { get; private set; }
    public string Email { get; private set; }
    public string Phone { get; private set; }
    public string? Notes { get; private set; }

    private Customer()
    {
        Name = string.Empty;
        Email = string.Empty;
        Phone = string.Empty;
    }

    public static Customer Create(string name, string email, string phone, string? notes = null)
    {
        return new Customer
        {
            Id = Guid.NewGuid(),
            Name = name,
            Email = email,
            Phone = phone,
            Notes = notes
        };
    }

    public void Update(string name, string email, string phone, string? notes)
    {
        Name = name;
        Email = email;
        Phone = phone;
        Notes = notes;
    }
}
