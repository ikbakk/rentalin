using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Rentalin.Notifications.Domain.Entities;
using Rentalin.Notifications.Domain.Enums;

namespace Rentalin.Infrastructure.Data.Configurations;

public sealed class NotificationRecordConfiguration : IEntityTypeConfiguration<NotificationRecord>
{
    public void Configure(EntityTypeBuilder<NotificationRecord> builder)
    {
        builder.HasKey(n => n.Id);

        builder.Property(n => n.Type).IsRequired().HasConversion<string>().HasMaxLength(50);
        builder.Property(n => n.Recipient).IsRequired().HasMaxLength(200);
        builder.Property(n => n.Template).IsRequired().HasMaxLength(100);
        builder.Property(n => n.Message).IsRequired();
        builder.Property(n => n.Status).IsRequired().HasConversion<string>().HasMaxLength(50);
        builder.Property(n => n.CreatedAt).IsRequired();
        builder.Property(n => n.FailureReason).HasMaxLength(500);
    }
}
