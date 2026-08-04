using FluentAssertions;
using Rentalin.Core.Exceptions;
using Rentalin.Fleet.Domain.Entities;

namespace Rentalin.Domain.Tests.Entities;

public sealed class BusinessTests
{
    // ── Slug generation via Create ─────────────────────────────────

    [Theory]
    [InlineData("Acme Rentals", "acme-rentals")]
    [InlineData("Budi's Cars", "budis-cars")]
    [InlineData("  Extra  Spaces  ", "extra-spaces")]
    [InlineData("UPPERCASE RENTAL", "uppercase-rental")]
    [InlineData("Mobil-99 Jaya", "mobil-99-jaya")]
    public void Create_ShouldGenerateSlugFromName(string name, string expectedSlug)
    {
        var business = Business.Create(name, "Jl. Test 123", "08123456789", "test@example.com");

        business.Slug.Should().Be(expectedSlug);
    }

    // ── SetSlug: valid slugs ───────────────────────────────────────

    [Theory]
    [InlineData("acme-rentals")]
    [InlineData("my-business-123")]
    [InlineData("ab")]
    [InlineData("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa")]
    public void SetSlug_ValidSlug_ShouldSet(string slug)
    {
        var business = Business.Create("Test Business", "Jl. Test 123", "08123456789", "test@example.com");

        business.SetSlug(slug);

        business.Slug.Should().Be(slug);
    }

    // ── SetSlug: empty or whitespace ───────────────────────────────

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void SetSlug_EmptyOrWhitespace_ShouldThrow(string? slug)
    {
        var business = Business.Create("Test Business", "Jl. Test 123", "08123456789", "test@example.com");

        var act = () => business.SetSlug(slug!);

        act.Should().Throw<DomainException>();
    }

    // ── SetSlug: invalid length ────────────────────────────────────

    [Theory]
    [InlineData("x")]
    [InlineData("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa")]
    public void SetSlug_InvalidLength_ShouldThrow(string slug)
    {
        var business = Business.Create("Test Business", "Jl. Test 123", "08123456789", "test@example.com");

        var act = () => business.SetSlug(slug);

        act.Should().Throw<DomainException>();
    }

    // ── SetSlug: invalid characters ────────────────────────────────

    public static IEnumerable<object[]> InvalidCharacterData =>
        new List<object[]>
        {
            new object[] { "hello world" },
            new object[] { "hello_world" },
            new object[] { "Hello-World" },
            new object[] { "hello.world" },
            new object[] { "café" },
        };

    [Theory]
    [MemberData(nameof(InvalidCharacterData))]
    public void SetSlug_InvalidCharacters_ShouldThrow(string slug)
    {
        var business = Business.Create("Test Business", "Jl. Test 123", "08123456789", "test@example.com");

        var act = () => business.SetSlug(slug);

        act.Should().Throw<DomainException>();
    }

    // ── SetSlug: reserved words ────────────────────────────────────

    public static IEnumerable<object[]> ReservedWordData =>
        new List<object[]>
        {
            new object[] { "vehicles" },
            new object[] { "rentals" },
            new object[] { "portal" },
            new object[] { "api" },
            new object[] { "health" },
            new object[] { "login" },
            new object[] { "book" },
            new object[] { "booking" },
            new object[] { "tx" },
        };

    [Theory]
    [MemberData(nameof(ReservedWordData))]
    public void SetSlug_ReservedWord_ShouldThrow(string slug)
    {
        var business = Business.Create("Test Business", "Jl. Test 123", "08123456789", "test@example.com");

        var act = () => business.SetSlug(slug);

        act.Should().Throw<DomainException>();
    }

    // ── UpdateDetails regenerates slug ────────────────────────────

    [Fact]
    public void UpdateDetails_ShouldRegenerateSlugFromName()
    {
        var business = Business.Create("Old Name", "Jl. Test 123", "08123456789", "test@example.com");

        business.UpdateDetails("New Name", "Jl. Baru 456", "08987654321", "new@example.com");

        business.Slug.Should().Be("new-name");
        business.Name.Should().Be("New Name");
        business.Address.Should().Be("Jl. Baru 456");
    }

    // ── Slug survives valid business lifecycle ─────────────────────

    [Fact]
    public void Create_ShouldHaveNonEmptySlug()
    {
        var business = Business.Create("Acme Rentals", "Jl. Test 123", "08123456789", "test@example.com");

        business.Slug.Should().NotBeNullOrEmpty();
        business.Id.Should().NotBeEmpty();
    }
}
