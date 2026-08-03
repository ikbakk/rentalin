using Microsoft.EntityFrameworkCore;
using Rentalin.Core.Interfaces;

namespace Rentalin.Infrastructure.Data;

public sealed class Repository<T> : IRepository<T> where T : class
{
    private readonly RentalinDbContext _context;
    private readonly DbSet<T> _set;

    public Repository(RentalinDbContext context)
    {
        _context = context;
        _set = context.Set<T>();
    }

    public void Add(T entity) => _set.Add(entity);
    public void Update(T entity) => _set.Update(entity);
    public void Delete(T entity) => _set.Remove(entity);

    public async Task<T?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        return await _set.FindAsync([id], ct);
    }

    public async Task<IReadOnlyList<T>> GetAllAsync(CancellationToken ct = default)
    {
        return await _set.AsNoTracking().ToListAsync(ct);
    }
}
