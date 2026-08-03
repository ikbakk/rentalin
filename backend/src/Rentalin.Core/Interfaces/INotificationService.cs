namespace Rentalin.Core.Interfaces;

public interface INotificationService
{
    Task SendAsync(string recipient, string subject, string body, CancellationToken ct = default);
    Task SendWhatsAppAsync(string phoneNumber, string message, CancellationToken ct = default);
}
