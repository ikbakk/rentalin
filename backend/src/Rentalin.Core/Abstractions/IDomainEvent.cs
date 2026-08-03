using MediatR;

namespace Rentalin.Core.Abstractions;

public interface IDomainEvent : INotification
{
    Guid Id { get; }
    DateTimeOffset OccurredAt { get; }
}
