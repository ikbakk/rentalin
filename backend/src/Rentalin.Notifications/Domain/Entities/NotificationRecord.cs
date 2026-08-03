using Rentalin.Core.Entities;
using Rentalin.Notifications.Domain.Enums;

namespace Rentalin.Notifications.Domain.Entities;

public sealed class NotificationRecord : AggregateRoot
{
    public NotificationType Type { get; private set; }
    public string Recipient { get; private set; }
    public string Template { get; private set; }
    public string Message { get; private set; }
    public NotificationStatus Status { get; private set; }
    public DateTimeOffset CreatedAt { get; private set; }
    public DateTimeOffset? SentAt { get; private set; }
    public DateTimeOffset? DeliveredAt { get; private set; }
    public string? FailureReason { get; private set; }

    private NotificationRecord()
    {
        Recipient = string.Empty;
        Template = string.Empty;
        Message = string.Empty;
    }

    public static NotificationRecord Create(
        NotificationType type,
        string recipient,
        string template,
        string message)
    {
        return new NotificationRecord
        {
            Id = Guid.NewGuid(),
            Type = type,
            Recipient = recipient,
            Template = template,
            Message = message,
            Status = NotificationStatus.Queued,
            CreatedAt = DateTimeOffset.UtcNow
        };
    }

    public void MarkSent()
    {
        Status = NotificationStatus.Sent;
        SentAt = DateTimeOffset.UtcNow;
    }

    public void MarkDelivered()
    {
        Status = NotificationStatus.Delivered;
        DeliveredAt = DateTimeOffset.UtcNow;
    }

    public void MarkFailed(string reason)
    {
        Status = NotificationStatus.Failed;
        FailureReason = reason;
    }
}
