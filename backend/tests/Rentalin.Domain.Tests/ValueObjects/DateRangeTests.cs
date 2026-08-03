using FluentAssertions;
using Rentalin.Core.Exceptions;
using Rentalin.Core.ValueObjects;

namespace Rentalin.Domain.Tests.ValueObjects;

public sealed class DateRangeTests
{
    [Fact]
    public void Create_ValidDates_ShouldSucceed()
    {
        var start = DateTimeOffset.UtcNow;
        var end = start.AddDays(5);

        var range = new DateRange(start, end);

        range.Start.Should().Be(start);
        range.End.Should().Be(end);
    }

    [Fact]
    public void Create_EndBeforeStart_ShouldThrow()
    {
        var start = DateTimeOffset.UtcNow;

        var act = () => new DateRange(start, start.AddDays(-1));

        act.Should().Throw<DomainException>()
            .WithMessage("End date must be after start date.");
    }

    [Fact]
    public void Create_EndEqualsStart_ShouldThrow()
    {
        var now = DateTimeOffset.UtcNow;

        var act = () => new DateRange(now, now);

        act.Should().Throw<DomainException>()
            .WithMessage("End date must be after start date.");
    }

    [Fact]
    public void Days_ReturnsCorrectCount()
    {
        var range = new DateRange(
            new DateTimeOffset(2026, 1, 1, 0, 0, 0, TimeSpan.Zero),
            new DateTimeOffset(2026, 1, 5, 0, 0, 0, TimeSpan.Zero));

        range.Days.Should().Be(4);
    }

    [Fact]
    public void Overlaps_FullyContained_ShouldReturnTrue()
    {
        var jan = new DateRange(
            new DateTimeOffset(2026, 1, 1, 0, 0, 0, TimeSpan.Zero),
            new DateTimeOffset(2026, 1, 31, 0, 0, 0, TimeSpan.Zero));
        var midJan = new DateRange(
            new DateTimeOffset(2026, 1, 10, 0, 0, 0, TimeSpan.Zero),
            new DateTimeOffset(2026, 1, 15, 0, 0, 0, TimeSpan.Zero));

        jan.Overlaps(midJan).Should().BeTrue();
    }

    [Fact]
    public void Overlaps_PartialOverlap_ShouldReturnTrue()
    {
        var first = new DateRange(
            new DateTimeOffset(2026, 1, 1, 0, 0, 0, TimeSpan.Zero),
            new DateTimeOffset(2026, 1, 10, 0, 0, 0, TimeSpan.Zero));
        var second = new DateRange(
            new DateTimeOffset(2026, 1, 5, 0, 0, 0, TimeSpan.Zero),
            new DateTimeOffset(2026, 1, 15, 0, 0, 0, TimeSpan.Zero));

        first.Overlaps(second).Should().BeTrue();
    }

    [Fact]
    public void Overlaps_NonOverlapping_ShouldReturnFalse()
    {
        var jan = new DateRange(
            new DateTimeOffset(2026, 1, 1, 0, 0, 0, TimeSpan.Zero),
            new DateTimeOffset(2026, 1, 10, 0, 0, 0, TimeSpan.Zero));
        var feb = new DateRange(
            new DateTimeOffset(2026, 2, 1, 0, 0, 0, TimeSpan.Zero),
            new DateTimeOffset(2026, 2, 10, 0, 0, 0, TimeSpan.Zero));

        jan.Overlaps(feb).Should().BeFalse();
    }

    [Fact]
    public void Overlaps_Adjacent_ShouldReturnFalse()
    {
        var first = new DateRange(
            new DateTimeOffset(2026, 1, 1, 0, 0, 0, TimeSpan.Zero),
            new DateTimeOffset(2026, 1, 10, 0, 0, 0, TimeSpan.Zero));
        var second = new DateRange(
            new DateTimeOffset(2026, 1, 10, 0, 0, 0, TimeSpan.Zero),
            new DateTimeOffset(2026, 1, 20, 0, 0, 0, TimeSpan.Zero));

        first.Overlaps(second).Should().BeFalse();
    }
}
