namespace Rentalin.Notifications.Services;

public interface INotificationService
{
    Task SendWhatsAppAsync(string phone, string message, CancellationToken ct = default);
    Task SendEmailAsync(string email, string subject, string body, CancellationToken ct = default);
}
