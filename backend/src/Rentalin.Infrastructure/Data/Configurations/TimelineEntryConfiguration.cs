using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Rentalin.Timeline.Domain.Entities;

namespace Rentalin.Infrastructure.Data.Configurations;

public sealed class TimelineEntryConfiguration : IEntityTypeConfiguration<TimelineEntry>
{
    public void Configure(EntityTypeBuilder<TimelineEntry> builder)
    {
        builder.HasKey(t => t.Id);

        builder.Property(t => t.ReferenceType).IsRequired().HasMaxLength(100);
        builder.Property(t => t.ReferenceId).IsRequired();
        builder.Property(t => t.EventType).IsRequired().HasMaxLength(100);
        builder.Property(t => t.Description).IsRequired().HasMaxLength(500);
        builder.Property(t => t.OccurredAt).IsRequired();
        builder.Property(t => t.Actor).IsRequired().HasMaxLength(100);
    }
}
