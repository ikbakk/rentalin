using Microsoft.EntityFrameworkCore;
using Rentalin.Core.Entities;
using Rentalin.Damage.Domain.Entities;
using Rentalin.Fleet.Domain.Entities;
using Rentalin.Inspections.Domain.Entities;
using Rentalin.Maintenance.Domain.Entities;
using Rentalin.Notifications.Domain.Entities;
using Rentalin.Reservations.Domain.Entities;
using Rentalin.Timeline.Domain.Entities;

namespace Rentalin.Infrastructure.Data;

public sealed class RentalinDbContext : DbContext
{
    public DbSet<Vehicle> Vehicles => Set<Vehicle>();
    public DbSet<Customer> Customers => Set<Customer>();
    public DbSet<Inquiry> Inquiries => Set<Inquiry>();
    public DbSet<Reservation> Reservations => Set<Reservation>();
    public DbSet<Rental> Rentals => Set<Rental>();
    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<Inspection> Inspections => Set<Inspection>();
    public DbSet<TimelineEntry> TimelineEntries => Set<TimelineEntry>();
    public DbSet<Business> Businesses => Set<Business>();
    public DbSet<Staff> Staff => Set<Staff>();
    public DbSet<Attachment> Attachments => Set<Attachment>();
    public DbSet<DamageRecord> DamageRecords => Set<DamageRecord>();
    public DbSet<MaintenanceRecord> MaintenanceRecords => Set<MaintenanceRecord>();
    public DbSet<NotificationRecord> NotificationRecords => Set<NotificationRecord>();

    public RentalinDbContext(DbContextOptions<RentalinDbContext> options) : base(options)
    {
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(RentalinDbContext).Assembly);
    }
}
