using Rentalin.Core.Entities;

namespace Rentalin.Fleet.Domain.Entities;

public sealed class Business : AggregateRoot
{
    public string Name { get; private set; }
    public string Address { get; private set; }
    public string PhoneNumber { get; private set; }
    public string Email { get; private set; }
    public string? LogoUrl { get; private set; }

    private Business()
    {
        Name = string.Empty;
        Address = string.Empty;
        PhoneNumber = string.Empty;
        Email = string.Empty;
    }

    public static Business Create(string name, string address, string phoneNumber, string email)
    {
        return new Business
        {
            Id = Guid.NewGuid(),
            Name = name,
            Address = address,
            PhoneNumber = phoneNumber,
            Email = email
        };
    }

    public void UpdateDetails(string name, string address, string phoneNumber, string email)
    {
        Name = name;
        Address = address;
        PhoneNumber = phoneNumber;
        Email = email;
    }
}
