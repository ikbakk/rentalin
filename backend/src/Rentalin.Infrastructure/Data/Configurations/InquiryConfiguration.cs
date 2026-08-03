using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Rentalin.Reservations.Domain.Entities;

namespace Rentalin.Infrastructure.Data.Configurations;

public sealed class InquiryConfiguration : IEntityTypeConfiguration<Inquiry>
{
    public void Configure(EntityTypeBuilder<Inquiry> builder)
    {
        builder.HasKey(i => i.Id);

        builder.Property(i => i.CustomerId).IsRequired();
        builder.Property(i => i.VehicleId).IsRequired();
        builder.Property(i => i.Status).IsRequired().HasConversion<string>().HasMaxLength(50);
        builder.Property(i => i.Notes).HasMaxLength(500);

        builder.OwnsOne(i => i.RentalPeriod, period =>
        {
            period.Property(p => p.Start).HasColumnName("RentalPeriod_Start").IsRequired();
            period.Property(p => p.End).HasColumnName("RentalPeriod_End").IsRequired();
        });
    }
}
