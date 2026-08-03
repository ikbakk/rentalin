using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Rentalin.Damage.Domain.Entities;

namespace Rentalin.Infrastructure.Data.Configurations;

public sealed class DamageRecordConfiguration : IEntityTypeConfiguration<DamageRecord>
{
    public void Configure(EntityTypeBuilder<DamageRecord> builder)
    {
        builder.HasKey(d => d.Id);

        builder.Property(d => d.RentalId).IsRequired();
        builder.Property(d => d.VehicleId).IsRequired();
        builder.Property(d => d.Description).IsRequired().HasMaxLength(2000);
        builder.Property(d => d.Severity).IsRequired().HasConversion<string>().HasMaxLength(50);
        builder.Property(d => d.Status).IsRequired().HasConversion<string>().HasMaxLength(50);
        builder.Property(d => d.ResponsibleParty).IsRequired().HasConversion<string>().HasMaxLength(50);
        builder.Property(d => d.ResolutionNotes).HasMaxLength(2000);

        builder.Property(d => d.PhotoUrls)
            .HasConversion(
                v => string.Join(",", v),
                v => v.Split(",", StringSplitOptions.RemoveEmptyEntries).ToList());
    }
}
