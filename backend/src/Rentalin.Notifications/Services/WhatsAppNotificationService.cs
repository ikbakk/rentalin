using Microsoft.Extensions.Logging;

namespace Rentalin.Notifications.Services;

public sealed class WhatsAppNotificationService : INotificationService
{
    private readonly ILogger<WhatsAppNotificationService> _logger;

    public WhatsAppNotificationService(ILogger<WhatsAppNotificationService> logger)
    {
        _logger = logger;
    }

    public Task SendWhatsAppAsync(string phone, string message, CancellationToken ct = default)
    {
        _logger.LogInformation(
            "[WhatsApp STUB] Sending to {Phone}: {Message}",
            phone,
            message.Length > 100 ? message[..100] + "..." : message);

        return Task.CompletedTask;
    }

    public Task SendEmailAsync(string email, string subject, string body, CancellationToken ct = default)
    {
        _logger.LogInformation(
            "[Email STUB] Sending to {Email} | Subject: {Subject}",
            email,
            subject);

        return Task.CompletedTask;
    }
}
