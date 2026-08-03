using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Rentalin.Fleet.Domain.Entities;

namespace Rentalin.Infrastructure.Data.Configurations;

public sealed class VehicleConfiguration : IEntityTypeConfiguration<Vehicle>
{
    public void Configure(EntityTypeBuilder<Vehicle> builder)
    {
        builder.HasKey(v => v.Id);

        builder.Property(v => v.LicensePlate)
            .IsRequired()
            .HasMaxLength(20);

        builder.HasIndex(v => v.LicensePlate).IsUnique();

        builder.Property(v => v.Make).IsRequired().HasMaxLength(100);
        builder.Property(v => v.Model).IsRequired().HasMaxLength(100);
        builder.Property(v => v.Year).IsRequired();
        builder.Property(v => v.Color).IsRequired().HasMaxLength(50);
        builder.Property(v => v.SeatingCapacity).IsRequired();
        builder.Property(v => v.Status).IsRequired().HasConversion<string>().HasMaxLength(50);
        builder.Property(v => v.BusinessId).IsRequired();

        builder.OwnsOne(v => v.DailyRate, money =>
        {
            money.Property(m => m.Amount).HasColumnName("DailyRate_Amount").IsRequired();
            money.Property(m => m.Currency).HasColumnName("DailyRate_Currency").IsRequired().HasMaxLength(3);
        });
    }
}
