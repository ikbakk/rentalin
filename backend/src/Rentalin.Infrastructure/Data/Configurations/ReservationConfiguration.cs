using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Rentalin.Reservations.Domain.Entities;

namespace Rentalin.Infrastructure.Data.Configurations;

public sealed class ReservationConfiguration : IEntityTypeConfiguration<Reservation>
{
    public void Configure(EntityTypeBuilder<Reservation> builder)
    {
        builder.HasKey(r => r.Id);

        builder.Property(r => r.InquiryId).IsRequired();
        builder.Property(r => r.CustomerId).IsRequired();
        builder.Property(r => r.VehicleId).IsRequired();
        builder.Property(r => r.Status).IsRequired().HasConversion<string>().HasMaxLength(50);

        builder.OwnsOne(r => r.EstimatedCost, money =>
        {
            money.Property(m => m.Amount).HasColumnName("EstimatedCost_Amount").IsRequired();
            money.Property(m => m.Currency).HasColumnName("EstimatedCost_Currency").IsRequired().HasMaxLength(3);
        });

        builder.OwnsOne(r => r.RentalPeriod, period =>
        {
            period.Property(p => p.Start).HasColumnName("RentalPeriod_Start").IsRequired();
            period.Property(p => p.End).HasColumnName("RentalPeriod_End").IsRequired();
        });
    }
}
