using Rentalin.Core.Abstractions;

namespace Rentalin.Core.Entities;

public abstract class AggregateRoot : AggregateRoot<Guid>
{
    protected AggregateRoot() : base(Guid.NewGuid())
    {
    }

    protected AggregateRoot(Guid id) : base(id)
    {
    }
}

public abstract class AggregateRoot<TId> : Entity<TId>, IAggregateRoot where TId : notnull
{
    private readonly List<IDomainEvent> _domainEvents = [];

    protected AggregateRoot(TId id) : base(id)
    {
    }

    public IReadOnlyCollection<IDomainEvent> DomainEvents => _domainEvents.AsReadOnly();

    protected void AddDomainEvent(IDomainEvent domainEvent)
    {
        _domainEvents.Add(domainEvent);
    }

    public void ClearDomainEvents()
    {
        _domainEvents.Clear();
    }
}
