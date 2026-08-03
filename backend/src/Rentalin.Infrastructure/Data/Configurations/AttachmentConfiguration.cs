using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Rentalin.Core.Entities;

namespace Rentalin.Infrastructure.Data.Configurations;

public sealed class AttachmentConfiguration : IEntityTypeConfiguration<Attachment>
{
    public void Configure(EntityTypeBuilder<Attachment> builder)
    {
        builder.HasKey(a => a.Id);

        builder.HasIndex(a => new { a.ReferenceType, a.ReferenceId });

        builder.Property(a => a.ReferenceType).IsRequired().HasMaxLength(100);
        builder.Property(a => a.ReferenceId).IsRequired();
        builder.Property(a => a.FileName).IsRequired().HasMaxLength(500);
        builder.Property(a => a.ContentType).IsRequired().HasMaxLength(100);
        builder.Property(a => a.FileUrl).IsRequired().HasMaxLength(2000);
        builder.Property(a => a.FileSizeBytes).IsRequired();
        builder.Property(a => a.UploadedAt).IsRequired();
    }
}
