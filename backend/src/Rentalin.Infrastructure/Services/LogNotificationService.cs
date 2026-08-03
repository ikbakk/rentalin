using Microsoft.Extensions.Logging;
using Rentalin.Core.Interfaces;

namespace Rentalin.Infrastructure.Services;

public sealed class LogNotificationService : INotificationService
{
    private readonly ILogger<LogNotificationService> _logger;

    public LogNotificationService(ILogger<LogNotificationService> logger)
    {
        _logger = logger;
    }

    public Task SendAsync(string recipient, string subject, string body, CancellationToken ct = default)
    {
        _logger.LogInformation("[EMAIL STUB] to {Recipient}: {Subject} — {Body}", recipient, subject, body);
        return Task.CompletedTask;
    }

    public Task SendWhatsAppAsync(string phoneNumber, string message, CancellationToken ct = default)
    {
        _logger.LogInformation("[WHATSAPP STUB] to {Phone}: {Message}", phoneNumber, message);
        return Task.CompletedTask;
    }
}
