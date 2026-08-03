using Rentalin.Core.Entities;

namespace Rentalin.Fleet.Domain.Entities;

public sealed class Staff : AggregateRoot
{
    public string Name { get; private set; }
    public string Email { get; private set; }
    public string PhoneNumber { get; private set; }
    public string Role { get; private set; }
    public Guid BusinessId { get; private set; }
    public bool IsActive { get; private set; }
    public string? PasswordHash { get; private set; }

    private Staff()
    {
        Name = string.Empty;
        Email = string.Empty;
        PhoneNumber = string.Empty;
        Role = string.Empty;
    }

    public static Staff Create(string name, string email, string phoneNumber, string role, Guid businessId)
    {
        return new Staff
        {
            Id = Guid.NewGuid(),
            Name = name,
            Email = email,
            PhoneNumber = phoneNumber,
            Role = role,
            BusinessId = businessId,
            IsActive = true
        };
    }

    public void Deactivate()
    {
        IsActive = false;
    }

    public void SetPassword(string password)
    {
        PasswordHash = BCrypt.Net.BCrypt.HashPassword(password);
    }
}
