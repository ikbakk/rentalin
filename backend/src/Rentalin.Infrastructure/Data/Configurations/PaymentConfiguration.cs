using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Rentalin.Reservations.Domain.Entities;

namespace Rentalin.Infrastructure.Data.Configurations;

public sealed class PaymentConfiguration : IEntityTypeConfiguration<Payment>
{
    public void Configure(EntityTypeBuilder<Payment> builder)
    {
        builder.HasKey(p => p.Id);

        builder.Property(p => p.RentalId).IsRequired();
        builder.Property(p => p.Method).IsRequired().HasConversion<string>().HasMaxLength(50);
        builder.Property(p => p.Status).IsRequired().HasConversion<string>().HasMaxLength(50);

        builder.OwnsOne(p => p.Amount, money =>
        {
            money.Property(m => m.Amount).HasColumnName("Amount_Value").IsRequired();
            money.Property(m => m.Currency).HasColumnName("Amount_Currency").IsRequired().HasMaxLength(3);
        });
    }
}
