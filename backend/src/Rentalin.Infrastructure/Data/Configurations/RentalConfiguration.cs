using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Rentalin.Reservations.Domain.Entities;

namespace Rentalin.Infrastructure.Data.Configurations;

public sealed class RentalConfiguration : IEntityTypeConfiguration<Rental>
{
    public void Configure(EntityTypeBuilder<Rental> builder)
    {
        builder.HasKey(r => r.Id);

        builder.Property(r => r.ReservationId).IsRequired();
        builder.Property(r => r.VehicleId).IsRequired();
        builder.Property(r => r.CustomerId).IsRequired();
        builder.Property(r => r.ActualStart).IsRequired(false);
        builder.Property(r => r.ActualEnd).IsRequired(false);
        builder.Property(r => r.OdometerStart).IsRequired(false);
        builder.Property(r => r.OdometerEnd).IsRequired(false);
        builder.Property(r => r.Status).IsRequired().HasConversion<string>().HasMaxLength(50);

        builder.OwnsMany(r => r.Extensions, ext =>
        {
            ext.WithOwner().HasForeignKey("RentalId");
            ext.HasKey(e => e.Id);
            ext.Property(e => e.NewEnd).IsRequired();
            ext.OwnsOne(e => e.AdditionalCost, money =>
            {
                money.Property(m => m.Amount).HasColumnName("AdditionalCost_Amount").IsRequired();
                money.Property(m => m.Currency).HasColumnName("AdditionalCost_Currency").IsRequired().HasMaxLength(3);
            });
        });
    }
}
