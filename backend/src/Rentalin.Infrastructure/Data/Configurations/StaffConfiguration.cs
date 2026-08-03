using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Rentalin.Fleet.Domain.Entities;

namespace Rentalin.Infrastructure.Data.Configurations;

public sealed class StaffConfiguration : IEntityTypeConfiguration<Staff>
{
    public void Configure(EntityTypeBuilder<Staff> builder)
    {
        builder.HasKey(s => s.Id);

        builder.Property(s => s.Name).IsRequired().HasMaxLength(200);
        builder.Property(s => s.Email).IsRequired().HasMaxLength(200);
        builder.Property(s => s.PhoneNumber).IsRequired().HasMaxLength(50);
        builder.Property(s => s.Role).IsRequired().HasMaxLength(100);
        builder.Property(s => s.BusinessId).IsRequired();
        builder.Property(s => s.IsActive).IsRequired();
    }
}
