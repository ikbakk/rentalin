namespace Rentalin.Notifications.Domain.Enums;

public enum NotificationType
{
    WhatsApp,
    Email
}

public enum NotificationStatus
{
    Queued,
    Sent,
    Delivered,
    Failed
}
