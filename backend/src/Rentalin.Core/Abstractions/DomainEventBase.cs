namespace Rentalin.Core.Abstractions;

public abstract record DomainEventBase : IDomainEvent
{
    public Guid Id { get; } = Guid.NewGuid();
    public DateTimeOffset OccurredAt { get; } = DateTimeOffset.UtcNow;
}
