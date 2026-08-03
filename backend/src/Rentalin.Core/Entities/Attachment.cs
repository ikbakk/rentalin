namespace Rentalin.Core.Entities;

public sealed class Attachment : Entity<Guid>
{
    public string ReferenceType { get; private set; }
    public Guid ReferenceId { get; private set; }
    public string FileName { get; private set; }
    public string ContentType { get; private set; }
    public string FileUrl { get; private set; }
    public long FileSizeBytes { get; private set; }
    public DateTimeOffset UploadedAt { get; private set; }

    private Attachment()
    {
        ReferenceType = string.Empty;
        FileName = string.Empty;
        ContentType = string.Empty;
        FileUrl = string.Empty;
    }

    public static Attachment Create(string referenceType, Guid referenceId, string fileName, string contentType, string fileUrl, long fileSizeBytes)
    {
        return new Attachment
        {
            Id = Guid.NewGuid(),
            ReferenceType = referenceType,
            ReferenceId = referenceId,
            FileName = fileName,
            ContentType = contentType,
            FileUrl = fileUrl,
            FileSizeBytes = fileSizeBytes,
            UploadedAt = DateTimeOffset.UtcNow
        };
    }
}
