using Rentalin.Core.Interfaces;

namespace Rentalin.Infrastructure.Data;

public sealed class UnitOfWork : IUnitOfWork
{
    private readonly RentalinDbContext _context;

    public UnitOfWork(RentalinDbContext context)
    {
        _context = context;
    }

    public Task<int> SaveChangesAsync(CancellationToken ct = default)
    {
        return _context.SaveChangesAsync(ct);
    }
}
