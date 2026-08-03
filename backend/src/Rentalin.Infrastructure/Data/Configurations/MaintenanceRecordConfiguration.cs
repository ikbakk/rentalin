using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Rentalin.Maintenance.Domain.Entities;

namespace Rentalin.Infrastructure.Data.Configurations;

public sealed class MaintenanceRecordConfiguration : IEntityTypeConfiguration<MaintenanceRecord>
{
    public void Configure(EntityTypeBuilder<MaintenanceRecord> builder)
    {
        builder.HasKey(m => m.Id);

        builder.Property(m => m.VehicleId).IsRequired();
        builder.Property(m => m.Type).IsRequired().HasConversion<string>().HasMaxLength(50);
        builder.Property(m => m.Description).IsRequired().HasMaxLength(1000);
        builder.Property(m => m.Status).IsRequired().HasConversion<string>().HasMaxLength(50);
        builder.Property(m => m.ScheduledStart).IsRequired();
        builder.Property(m => m.Workshop).HasMaxLength(200);
        builder.Property(m => m.Notes).HasMaxLength(2000);

        builder.OwnsOne(m => m.Cost, money =>
        {
            money.Property(c => c.Amount).HasColumnName("Cost_Amount").IsRequired();
            money.Property(c => c.Currency).HasColumnName("Cost_Currency").IsRequired().HasMaxLength(3);
        });

        builder.Property(m => m.PhotoUrls)
            .HasConversion(
                v => string.Join(",", v),
                v => v.Split(",", StringSplitOptions.RemoveEmptyEntries).ToList());
    }
}
