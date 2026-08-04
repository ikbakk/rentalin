using System.Text.RegularExpressions;
using Rentalin.Core.Entities;
using Rentalin.Core.Exceptions;

namespace Rentalin.Fleet.Domain.Entities;

public partial class Business : AggregateRoot
{
    public string Name { get; private set; }
    public string Slug { get; private set; }
    public string Address { get; private set; }
    public string PhoneNumber { get; private set; }
    public string Email { get; private set; }
    public string? LogoUrl { get; private set; }

    private static readonly string[] ReservedSlugs =
    [
        "vehicles", "rentals", "portal", "api", "health",
        "login", "book", "booking", "tx"
    ];

    [GeneratedRegex("^[a-z0-9-]+$", RegexOptions.Compiled)]
    private static partial Regex SlugPattern();

    private Business()
    {
        Name = string.Empty;
        Slug = string.Empty;
        Address = string.Empty;
        PhoneNumber = string.Empty;
        Email = string.Empty;
    }

    public static Business Create(string name, string address, string phoneNumber, string email)
    {
        var slug = GenerateSlug(name);

        var business = new Business
        {
            Id = Guid.NewGuid(),
            Name = name,
            Address = address,
            PhoneNumber = phoneNumber,
            Email = email
        };

        business.SetSlug(slug);
        return business;
    }

    public void UpdateDetails(string name, string address, string phoneNumber, string email)
    {
        Name = name;
        Address = address;
        PhoneNumber = phoneNumber;
        Email = email;
        SetSlug(GenerateSlug(name));
    }

    public void SetSlug(string slug)
    {
        if (string.IsNullOrWhiteSpace(slug))
            throw new DomainException("Slug cannot be empty.");

        if (slug.Length < 2 || slug.Length > 50)
            throw new DomainException("Slug must be between 2 and 50 characters.");

        if (!SlugPattern().IsMatch(slug))
            throw new DomainException("Slug can only contain lowercase letters, numbers, and hyphens.");

        if (Array.IndexOf(ReservedSlugs, slug) >= 0)
            throw new DomainException($"'{slug}' is a reserved word and cannot be used as a slug.");

        Slug = slug;
    }

    private static string GenerateSlug(string name)
    {
        var slug = name.ToLowerInvariant();
        slug = Regex.Replace(slug, @"\s+", "-");
        slug = NonAlphaNumExceptHyphen().Replace(slug, "");
        slug = MultiHyphens().Replace(slug, "-");
        slug = slug.Trim('-');
        return slug;
    }

    [GeneratedRegex(@"[^a-z0-9-]")]
    private static partial Regex NonAlphaNumExceptHyphen();

    [GeneratedRegex(@"-+")]
    private static partial Regex MultiHyphens();
}
