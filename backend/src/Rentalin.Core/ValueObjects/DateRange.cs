using Rentalin.Core.Exceptions;

namespace Rentalin.Core.ValueObjects;

public sealed record DateRange
{
    public DateTimeOffset Start { get; }
    public DateTimeOffset End { get; }

    public DateRange(DateTimeOffset start, DateTimeOffset end)
    {
        if (end <= start)
            throw new DomainException("End date must be after start date.");

        Start = start;
        End = end;
    }

    public int Days => (End - Start).Days;

    public bool Overlaps(DateRange other)
    {
        return Start < other.End && other.Start < End;
    }
}
