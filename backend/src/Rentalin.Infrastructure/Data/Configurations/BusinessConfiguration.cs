using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Rentalin.Fleet.Domain.Entities;

namespace Rentalin.Infrastructure.Data.Configurations;

public sealed class BusinessConfiguration : IEntityTypeConfiguration<Business>
{
    public void Configure(EntityTypeBuilder<Business> builder)
    {
        builder.HasKey(b => b.Id);

        builder.Property(b => b.Name).IsRequired().HasMaxLength(200);
        builder.Property(b => b.Address).IsRequired().HasMaxLength(500);
        builder.Property(b => b.PhoneNumber).IsRequired().HasMaxLength(50);
        builder.Property(b => b.Email).IsRequired().HasMaxLength(200);
        builder.Property(b => b.LogoUrl).HasMaxLength(1000);
    }
}
