using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Rentalin.Inspections.Domain.Entities;

namespace Rentalin.Infrastructure.Data.Configurations;

public sealed class InspectionConfiguration : IEntityTypeConfiguration<Inspection>
{
    public void Configure(EntityTypeBuilder<Inspection> builder)
    {
        builder.HasKey(i => i.Id);

        builder.Property(i => i.VehicleId).IsRequired();
        builder.Property(i => i.RentalId).IsRequired();
        builder.Property(i => i.Type).IsRequired().HasConversion<string>().HasMaxLength(50);
        builder.Property(i => i.Status).IsRequired().HasConversion<string>().HasMaxLength(50);
        builder.Property(i => i.Notes).HasMaxLength(500);

        builder.Property(i => i.PhotoUrls)
            .HasConversion(
                v => System.Text.Json.JsonSerializer.Serialize(v, (System.Text.Json.JsonSerializerOptions?)null),
                v => System.Text.Json.JsonSerializer.Deserialize<List<string>>(v, (System.Text.Json.JsonSerializerOptions?)null) ?? new List<string>()
            );
    }
}
