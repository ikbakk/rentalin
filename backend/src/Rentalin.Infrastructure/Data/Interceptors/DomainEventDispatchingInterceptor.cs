using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.DependencyInjection;
using Rentalin.Core.Abstractions;

namespace Rentalin.Infrastructure.Data.Interceptors;

public sealed class DomainEventDispatchingInterceptor : SaveChangesInterceptor
{
    private readonly IServiceProvider _serviceProvider;

    public DomainEventDispatchingInterceptor(IServiceProvider serviceProvider)
    {
        _serviceProvider = serviceProvider;
    }

    public override async ValueTask<int> SavedChangesAsync(
        SaveChangesCompletedEventData eventData,
        int result,
        CancellationToken cancellationToken = default)
    {
        if (result > 0)
            await DispatchDomainEventsAsync(eventData.Context!, cancellationToken);

        return result;
    }

    private async Task DispatchDomainEventsAsync(DbContext context, CancellationToken ct)
    {
        var aggregates = context.ChangeTracker
            .Entries<IAggregateRoot>()
            .Where(e => e.Entity.DomainEvents.Count > 0)
            .ToList();

        if (aggregates.Count == 0)
            return;

        var domainEvents = aggregates
            .SelectMany(e => e.Entity.DomainEvents)
            .ToList();

        foreach (var agg in aggregates)
            agg.Entity.ClearDomainEvents();

        using var scope = _serviceProvider.CreateScope();
        var publisher = scope.ServiceProvider.GetRequiredService<IPublisher>();

        foreach (var domainEvent in domainEvents)
            await publisher.Publish(domainEvent, ct);
    }
}
