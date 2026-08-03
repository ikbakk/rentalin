using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Rentalin.Core.Interfaces;
using Rentalin.Infrastructure.Data;
using Rentalin.Infrastructure.Data.Interceptors;
using Rentalin.Infrastructure.Services;

namespace Rentalin.Infrastructure.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, string connectionString)
    {
        services.AddScoped<DomainEventDispatchingInterceptor>();

        services.AddDbContext<RentalinDbContext>((sp, options) =>
        {
            options.UseSqlite(connectionString);
            options.AddInterceptors(sp.GetRequiredService<DomainEventDispatchingInterceptor>());
        });

        services.AddScoped(typeof(IRepository<>), typeof(Repository<>));
        services.AddScoped<IUnitOfWork, UnitOfWork>();
        services.AddScoped<INotificationService, LogNotificationService>();

        return services;
    }
}
