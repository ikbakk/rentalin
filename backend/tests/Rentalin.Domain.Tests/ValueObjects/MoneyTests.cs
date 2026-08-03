using FluentAssertions;
using Rentalin.Core.Exceptions;
using Rentalin.Core.ValueObjects;

namespace Rentalin.Domain.Tests.ValueObjects;

public sealed class MoneyTests
{
    [Fact]
    public void Create_ValidValues_ShouldSucceed()
    {
        var money = new Money(1000m, "IDR");

        money.Amount.Should().Be(1000m);
        money.Currency.Should().Be("IDR");
    }

    [Fact]
    public void Create_NegativeAmount_ShouldThrow()
    {
        var act = () => new Money(-100, "IDR");

        act.Should().Throw<DomainException>()
            .WithMessage("Amount cannot be negative.");
    }

    [Fact]
    public void Create_NullCurrency_ShouldThrow()
    {
        var act = () => new Money(100, null!);

        act.Should().Throw<DomainException>()
            .WithMessage("Currency is required.");
    }

    [Fact]
    public void Create_EmptyCurrency_ShouldThrow()
    {
        var act = () => new Money(100, "");

        act.Should().Throw<DomainException>()
            .WithMessage("Currency is required.");
    }

    [Fact]
    public void Create_WhitespaceCurrency_ShouldThrow()
    {
        var act = () => new Money(100, "   ");

        act.Should().Throw<DomainException>()
            .WithMessage("Currency is required.");
    }

    [Fact]
    public void Create_NormalizesCurrencyToUpper()
    {
        var money = new Money(100, "idr");

        money.Currency.Should().Be("IDR");
    }

    [Fact]
    public void Zero_ReturnsMoneyWithZeroAmount()
    {
        var zero = Money.Zero("IDR");

        zero.Amount.Should().Be(0);
        zero.Currency.Should().Be("IDR");
    }

    [Fact]
    public void Equality_SameAmountAndCurrency_ShouldBeEqual()
    {
        var a = new Money(100, "IDR");
        var b = new Money(100, "IDR");

        a.Should().Be(b);
    }

    [Fact]
    public void Equality_DifferentCurrencies_ShouldNotBeEqual()
    {
        var a = new Money(100, "IDR");
        var b = new Money(100, "USD");

        a.Should().NotBe(b);
    }

    [Fact]
    public void Equality_DifferentAmounts_ShouldNotBeEqual()
    {
        var a = new Money(100, "IDR");
        var b = new Money(200, "IDR");

        a.Should().NotBe(b);
    }
}
